import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import express from "express";
import path from "path";
import fs from "fs/promises";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";
import { Octokit } from "@octokit/rest";
import Stripe from "stripe";
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const TEMPLATES_ROOT = path.join(process.cwd(), 'public', 'templates');

interface SiteConfig {
  tokens: Record<string, string>;
  theme: Record<string, string>;
  seo: { title: string; description: string };
}

// ---------------------------------------------------------------------------
// Shared template engine
// ---------------------------------------------------------------------------

async function loadManifest(templateId: string): Promise<any> {
  const manifestPath = path.join(TEMPLATES_ROOT, templateId, 'manifest.json');
  return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
}

function extractTokens(html: string): string[] {
  const set = new Set<string>();
  const re = /\{\{([A-Z_0-9]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set];
}

function processHtml(html: string, config: SiteConfig): string {
  const tokens = config?.tokens || {};
  for (const [key, value] of Object.entries(tokens)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  if (config?.seo?.description) {
    const seo = `\n  <!-- Texas Sons Generated -->\n  <meta name="description" content="${config.seo.description}">\n`;
    html = html.replace('</title>', `</title>${seo}`);
  }
  return html;
}

async function renderSite(
  templateId: string,
  versionId: string,
  config: SiteConfig,
  options: { includeAdmin?: boolean } = {}
): Promise<{ desktop: string; mobile: string | null; admin: string | null }> {
  const includeAdmin = options.includeAdmin ?? true;
  const manifest = await loadManifest(templateId);
  const versionFiles = manifest.versions?.[versionId];
  const templateDir = path.join(TEMPLATES_ROOT, templateId);
  const desktopFile = path.join(templateDir, versionFiles?.desktop || `${versionId}-desktop.html`);
  const mobileFile = path.join(templateDir, versionFiles?.mobile || `${versionId}-mobile.html`);

  let desktop: string | null = null;
  try {
    desktop = processHtml(await fs.readFile(desktopFile, 'utf8'), config);
  } catch {
    desktop = null;
  }
  if (!desktop) throw new Error(`Desktop HTML not found: ${desktopFile}`);

  let mobile: string | null = null;
  try {
    mobile = processHtml(await fs.readFile(mobileFile, 'utf8'), config);
  } catch {
    mobile = null;
  }

  let admin: string | null = null;
  if (includeAdmin && templateId !== 'universal-admin') {
    const adminFile = path.join(TEMPLATES_ROOT, 'admin', 'universal-admin.html');
    try {
      admin = processHtml(await fs.readFile(adminFile, 'utf8'), config);
    } catch {
      admin = null;
    }
  }

  return { desktop, mobile, admin };
}

function parseJsonResponse(raw: string): any {
  let text = (raw || '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');
  return JSON.parse(text.slice(start, end + 1));
}

function sanitizeProjectName(name: string): string {
  const slug = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return slug || 'texas-sons-site';
}

// ---------------------------------------------------------------------------
// Cloudflare Pages helpers (Direct Upload: JWT -> assets -> manifest deploy)
// ---------------------------------------------------------------------------

function getCloudflareCredentials(): { accountId: string; apiToken: string } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required in .env.local");
  }
  return { accountId, apiToken };
}

async function cfFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Cloudflare API error (${url}): ${JSON.stringify(data.errors || data)}`);
  }
  return data.result;
}

// Cloudflare Pages asset hash: blake3(base64(fileContent) + extension), hex, first 32 chars
function pagesFileHash(content: string, fileName: string): string {
  const base64 = Buffer.from(content).toString('base64');
  const ext = path.extname(fileName).slice(1);
  const hash = blake3(new TextEncoder().encode(base64 + ext));
  return bytesToHex(hash).slice(0, 32);
}

async function findPagesProject(accountId: string, apiToken: string, name: string): Promise<any | null> {
  try {
    return await cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${name}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
  } catch {
    return null;
  }
}

async function createPagesProject(accountId: string, apiToken: string, name: string): Promise<any> {
  return cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, production_branch: 'main' }),
  });
}

async function getUploadJwt(accountId: string, apiToken: string, projectName: string): Promise<string> {
  const result = await cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/upload-token`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  return result.jwt;
}

async function uploadAssets(jwt: string, files: { hash: string; content: string }[]): Promise<void> {
  const payload = files.map(f => ({
    key: f.hash,
    value: Buffer.from(f.content).toString('base64'),
    metadata: { contentType: 'text/html' },
    base64: true,
  }));
  await cfFetch(`https://api.cloudflare.com/client/v4/pages/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function upsertHashes(jwt: string, hashes: string[]): Promise<void> {
  await cfFetch(`https://api.cloudflare.com/client/v4/pages/assets/upsert-hashes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hashes }),
  });
}

async function createDeployment(
  accountId: string,
  apiToken: string,
  projectName: string,
  manifest: Record<string, string>
): Promise<string> {
  const form = new FormData();
  form.append('manifest', JSON.stringify(manifest));
  const result = await cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });
  return result?.url || `https://${projectName}.pages.dev`;
}

async function uploadDeployment(
  accountId: string,
  apiToken: string,
  projectName: string,
  files: Record<string, string>
): Promise<string> {
  const jwt = await getUploadJwt(accountId, apiToken, projectName);

  const entries = Object.entries(files).map(([filePath, content]) => ({
    path: filePath,
    content,
    hash: pagesFileHash(content, filePath),
  }));

  await uploadAssets(jwt, entries);
  await upsertHashes(jwt, entries.map(f => f.hash));

  const manifest: Record<string, string> = {};
  for (const f of entries) manifest[`/${f.path}`] = f.hash;

  return createDeployment(accountId, apiToken, projectName, manifest);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Octokit (GitHub API) lazily
  let octokitClient: Octokit | null = null;
  function getOctokit(): Octokit {
    if (!octokitClient) {
      const token = process.env.GITHUB_ACCESS_TOKEN;
      if (!token) {
        throw new Error("GITHUB_ACCESS_TOKEN environment variable is required");
      }
      octokitClient = new Octokit({ auth: token });
    }
    return octokitClient;
  }

  // Initialize Stripe lazily
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  }

  // Sample API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Template catalog (data-driven: add template folders + manifest + catalog entry)
  app.get("/api/templates", async (req, res) => {
    try {
      const catalogPath = path.join(TEMPLATES_ROOT, 'catalog.json');
      const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));

      const templates = [];
      for (const t of catalog.templates || []) {
        const versions = [];
        let defaultTokens: Record<string, string> = {};
        try {
          const manifest = await loadManifest(t.id);
          defaultTokens = manifest.defaultConfig?.tokens || {};
          for (const v of t.versions || []) {
            const vf = manifest.versions?.[v.id];
            versions.push({
              ...v,
              desktopHtml: vf?.desktop ? `/templates/${t.id}/${vf.desktop}` : '',
              mobileHtml: vf?.mobile ? `/templates/${t.id}/${vf.mobile}` : '',
            });
          }
        } catch {
          versions.push(...(t.versions || []));
        }
        templates.push({
          ...t,
          versions: versions.length ? versions : t.versions,
          defaultTokens,
        });
      }

      res.json({ success: true, templates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI content engine: fill the selected template's tokens from a business profile
  app.post("/api/generate-config", async (req, res) => {
    try {
      const { templateId, versionId, business } = req.body;
      if (!templateId || !versionId) {
        return res.status(400).json({ success: false, error: "templateId and versionId are required" });
      }

      const manifest = await loadManifest(templateId);
      const versionFiles = manifest.versions?.[versionId];
      const templateDir = path.join(TEMPLATES_ROOT, templateId);

      let html = '';
      try {
        html += await fs.readFile(path.join(templateDir, versionFiles?.desktop || `${versionId}-desktop.html`), 'utf8');
      } catch {}
      try {
        html += await fs.readFile(path.join(templateDir, versionFiles?.mobile || `${versionId}-mobile.html`), 'utf8');
      } catch {}

      const tokensInHtml = extractTokens(html);
      const defaults: Record<string, string> = manifest.defaultConfig?.tokens || {};
      const allTokens = [...new Set([...Object.keys(defaults), ...tokensInHtml])];

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const tokenList = allTokens.map(t => `- ${t} => "${defaults[t] || ''}"`).join('\n');
      const reviews = (business?.reviews || []).slice(0, 2)
        .map((r: any) => `"${r.text}" — ${r.author} (${r.rating}★)`)
        .join('\n');
      const photos = (business?.photos || []).slice(0, 2).join('\n');

      const prompt = `You are the content engine for "Texas Sons", a web agency that builds single-page marketing websites for local businesses using pre-made HTML templates. Your job is to fill every content placeholder (token) for a specific template with accurate, high-quality copy based on the business profile.

BUSINESS PROFILE:
- Name: ${business?.name || ''}
- Address: ${business?.address || ''}
- Type: ${business?.type || 'Local business'}
- Phone: ${business?.phone || ''}
- Hours: ${Array.isArray(business?.hours) ? business.hours.join(' | ') : (business?.hours || '')}
- Reviews:
${reviews || '- none available'}
- Business photos (URLs, may be empty):
${photos || '- none'}

TEMPLATE: ${manifest.name || templateId} (${req.body.industry || 'general'})
VERSION: ${versionId}

Fill every token below. The current default value follows "=>". Use client-specific content wherever the token represents client content:
- SITE_NAME / SITE_TITLE: use the business name (drop LLC/Inc suffixes if the name becomes too long).
- CONTACT_EMAIL: use the business email if known, otherwise a plausible info@<businessslug>.com
- CONTACT_PHONE: the business phone, otherwise keep default.
- BUSINESS_ADDRESS: the business address (single line).
- COPYRIGHT_YEAR: the current year (2026).
- HERO_IMAGE / CAMPAIGN_LOGO / logo tokens: prefer a business photo URL from the profile if one fits; otherwise keep the default.
- Service tokens: generate 3-5 realistic services this type of business offers, with plausible "From $XX" pricing for the industry.
- Testimonial tokens: convert the top reviews into quote + author pairs (keep the quote under 140 chars). If no reviews, use the defaults.
- Hero headline/tagline tokens: short, punchy, on-brand copy for the industry.
- For campaign tokens (candidate name, office title, pronouns): use the business name as the candidate and neutral defaults if unknown.

TOKENS:
${tokenList}

Return ONLY a JSON object in exactly this shape (no markdown, no commentary):
{
  "tokens": { "SITE_TITLE": "...", "SITE_NAME": "..." },
  "seo": { "title": "Page <title> for the site", "description": "A 1-2 sentence SEO meta description" }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      let aiConfig: any = {};
      try {
        aiConfig = parseJsonResponse(response.text || '');
      } catch (err) {
        console.warn('Failed to parse AI config, falling back to defaults:', err);
      }

      const tokens: Record<string, string> = {};
      for (const key of allTokens) {
        const val = aiConfig?.tokens?.[key];
        tokens[key] = typeof val === 'string' && val.trim() ? val : (defaults[key] || '');
      }

      const seo = {
        title: aiConfig?.seo?.title || manifest.defaultConfig?.seo?.title?.replace(/\{\{[A-Z_0-9]+\}\}/g, (m: string) => tokens[m.slice(2, -2)] || '') || tokens.SITE_TITLE || tokens.SITE_NAME || '',
        description: aiConfig?.seo?.description || manifest.defaultConfig?.seo?.description || '',
      };
      const theme = { ...(manifest.defaultConfig?.theme || {}), ...(aiConfig?.theme || {}) };

      res.json({ success: true, config: { tokens, theme, seo } });
    } catch (error: any) {
      console.error('Generate config error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Live preview renderer (returns rendered HTML for iframe/blob preview)
  app.post("/api/render-site", async (req, res) => {
    try {
      const { templateId, versionId, config } = req.body;
      if (!templateId || !versionId || !config) {
        return res.status(400).json({ success: false, error: "templateId, versionId, and config are required" });
      }
      const { desktop, mobile, admin } = await renderSite(templateId, versionId, config);
      res.json({ success: true, desktopHtml: desktop, mobileHtml: mobile, adminHtml: admin });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Deploy rendered site to Cloudflare Pages (free hosting, direct upload)
  app.post("/api/deploy", async (req, res) => {
    try {
      const { templateId, versionId, config, projectName } = req.body;
      if (!templateId || !versionId || !config) {
        return res.status(400).json({ success: false, error: "templateId, versionId, and config are required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const { desktop, mobile, admin } = await renderSite(templateId, versionId, config);

      const slug = sanitizeProjectName(projectName || config?.tokens?.SITE_NAME || templateId);

      let project = await findPagesProject(accountId, apiToken, slug);
      if (!project) {
        project = await createPagesProject(accountId, apiToken, slug);
      }

      const files: Record<string, string> = { 'index.html': desktop };
      if (mobile) files['mobile.html'] = mobile;
      if (admin) files['admin/index.html'] = admin;

      const deploymentUrl = await uploadDeployment(accountId, apiToken, slug, files);

      res.json({
        success: true,
        url: `https://${slug}.pages.dev`,
        deploymentUrl,
        projectName: slug,
      });
    } catch (error: any) {
      console.error('Deploy error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Provisioning & Template Generation Engine (legacy ZIP download)
  app.post("/api/provision", async (req, res) => {
    try {
      const { templateId, versionId, configOverrides, includeAdmin } = req.body;
      if (!templateId || !versionId) {
        return res.status(400).json({ success: false, error: "templateId and versionId are required" });
      }

      const manifest = await loadManifest(templateId);
      const finalConfig: SiteConfig = {
        tokens: { ...manifest.defaultConfig.tokens, ...(configOverrides?.tokens || {}) },
        theme:  { ...manifest.defaultConfig.theme,  ...(configOverrides?.theme  || {}) },
        seo:    { ...manifest.defaultConfig.seo,    ...(configOverrides?.seo    || {}) }
      };

      const { desktop, mobile, admin } = await renderSite(templateId, versionId, finalConfig, {
        includeAdmin: includeAdmin !== false,
      });

      const zip = new JSZip();
      zip.file('index.html', desktop);
      if (mobile) zip.file('mobile.html', mobile);
      if (admin) zip.folder('admin')!.file('index.html', admin);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${templateId}-${versionId}.zip"`);
      res.send(zipBuffer);
    } catch (error: any) {
      console.error('Provision error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });

  // Invoice Generation Route
  app.post("/api/invoice", async (req, res) => {
    try {
      const { amount, clientName } = req.body;
      const stripe = getStripe();

      // 1. Create a customer in Stripe
      const customer = await stripe.customers.create({
        name: clientName,
      });

      // 2. Create an invoice item (Stripe expects the amount in cents)
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(amount * 100),
        currency: 'usd',
        description: 'Web Design and Development Services',
      });

      // 3. Create the actual invoice
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 14,
      });

      res.json({
        success: true,
        message: `Successfully generated invoice for ${clientName}.`,
        invoiceId: invoice.id,
        invoiceUrl: invoice.hosted_invoice_url
      });
    } catch (error: any) {
      console.error("Stripe Invoice Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Proposal Route
  app.post("/api/proposal", async (req, res) => {
    try {
      const { businessName, businessAddress, typeOfBusiness } = req.body;
      const { GoogleGenAI } = await import("@google/genai");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Write a professional, concise web design and development proposal for a local business.

Business Details:
- Name: ${businessName}
- Address: ${businessAddress}
- Type: ${typeOfBusiness}

We are Texas Sons, a premium digital agency. We offer three tiers:
1. Spur (Static) - $1,500: Landing pages, clean design.
2. Ranger (Flow) - $3,500: CMS, dynamic content.
3. Maverick (Engine) - $7,500: Full-stack applications.

Draft a short, persuasive email proposal recommending we build them a modern website to capture more local traffic and elevate their brand. Keep it professional, not overly salesy, and highlight that we noticed they do not currently have a website listed on Google. Make it around 3-4 paragraphs.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ success: true, proposal: response.text });
    } catch (error: any) {
      console.error("AI Proposal Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Multimodal AI Photo / Menu / Flyer Extraction Route
  app.post("/api/extract-dossier", async (req, res) => {
    try {
      const { images, contextHint } = req.body;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, error: "At least one image is required" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const parts: any[] = [];

      for (const img of images) {
        if (!img.data) continue;
        const cleanBase64 = img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data;
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: img.mimeType || 'image/jpeg'
          }
        });
      }

      const extractionPrompt = `You are an expert digital agency architect for TX Sons Websites.
Analyze the provided image(s) (which may be a restaurant menu, business card, campaign flyer, brochure, storefront photo, price list, or marketing screenshot) and extract a comprehensive, production-ready website business dossier in valid JSON format.

${contextHint ? `User Context Hint: ${contextHint}` : ''}

You MUST return ONLY a valid JSON object matching this exact schema:
{
  "businessName": "Exact business or candidate name",
  "category": "One of: 'Campaign & Leadership', 'Food & Beverage', 'Beauty & Wellness', 'Home & Trade Services', 'Professional & Medical'",
  "theme": "One of: 'campaign-navy', 'luxury', 'crimson-bold', 'dark', 'light'",
  "tagline": "Punchy, authoritative, high-converting tagline/slogan for the hero section",
  "description": "2-3 sentence narrative bio, story, or mission statement for the business based on the image",
  "phone": "Phone number found on asset, or realistic Texas phone e.g. (512) 555-XXXX",
  "email": "Email address found or reasonable domain email",
  "address": "Physical location/address or city/state found on asset",
  "hours": "Operating hours if found, or Mon - Sat: 9:00 AM - 6:00 PM",
  "primaryColor": "Hex code representing the primary brand color (e.g. #00081e for navy, #1c1917 for dark, #0c0a09 for luxury)",
  "accentColor": "Hex code representing the most prominent accent color detected in the image (e.g. #C5A059 for gold, #dc2626 for red, #d97706 for amber, #f97316 for orange, #3b82f6 for blue)",
  "badges": [
    "3-4 short accreditation/authority badges based on what is in the image (e.g. '20+ Years Experience', 'Locally Owned & Operated', '100% Certified', 'Post Oak Smoked')"
  ],
  "proofBadgeText": "Short review/authority badge text (e.g. '4.9 Stars · 300+ Verified Reviews' or 'Official 2026 Endorsements')",
  "services": [
    {
      "title": "Service or Menu Item Name",
      "description": "Description of ingredients, scope, or details",
      "price": "Price if visible (e.g. '$24/plate', 'From $185', 'Free Estimate')",
      "duration": "Duration or category (e.g. 'Entree', '3.5 hrs', 'Core Priority')",
      "highlight": true
    }
  ],
  "testimonials": [
    {
      "quote": "A quote, testimonial, endorsement, or review found on the asset, or an authentic review based on the branding",
      "author": "Name of reviewer / endorser",
      "role": "Title, publication, or local area",
      "rating": 5
    }
  ]
}

Rules:
1. Extract ALL visible distinct services or menu items (up to 8 items).
2. If the image is a food menu, extract real food items with their actual prices and descriptions.
3. If the image is a political flyer/mailer, extract candidate platform priorities, endorsements, and official campaign disclosures.
4. If the image is a business card or contractor flyer, extract licenses, certifications, and service specialties.
5. Choose the theme and accentColor that visually matches the colors used in the uploaded photo.`;

      parts.push({ text: extractionPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: parts
      });

      const rawText = response.text || "{}";
      const cleanJsonText = rawText
        .replace(/^```json/gm, '')
        .replace(/^```/gm, '')
        .trim();

      const dossier = JSON.parse(cleanJsonText);

      res.json({ success: true, dossier });
    } catch (error: any) {
      console.error("AI Dossier Extraction Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to parse image with Gemini" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();