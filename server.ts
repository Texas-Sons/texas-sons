import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import express from "express";
import path from "path";
import fs from "fs/promises";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";
import { Octokit } from "@octokit/rest";
import Stripe from "stripe";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
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

function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLocalBusinessLd(snapshot: any, siteUrl: string): any {
  const profile = snapshot?.profile || {};
  const services = (snapshot?.services || [])
    .filter((s: any) => s?.title || s?.description)
    .slice(0, 12);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.name,
    url: `${siteUrl}/`,
    description: profile.description || profile.tagline || undefined,
    telephone: profile.phone || undefined,
    email: profile.email || undefined,
    image: profile.heroImage || undefined,
    address: profile.address
      ? { '@type': 'PostalAddress', streetAddress: profile.address }
      : undefined,
    hasOfferCatalog: services.length
      ? {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: services.map((s: any) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: s.title || s.description,
              description: s.description || undefined,
            },
          })),
        }
      : undefined,
  };
}

function buildSeoTags(snapshot: any, siteUrl: string): string {
  const profile = snapshot?.profile || {};
  const seo = snapshot?.seo || {};
  const name = profile.name || 'Local Business';
  const tagline = profile.tagline || '';
  const description = profile.description || '';
  const title = seo.title || (tagline ? `${name} — ${tagline}` : name);
  const metaDescription =
    seo.description ||
    description ||
    `${name} · ${profile.category || 'Local Business'} · ${profile.phone || 'Call for details'}`;
  const ld = JSON.stringify(buildLocalBusinessLd(snapshot, siteUrl)).replace(/</g, '\\u003c');

  const isCampaign = profile.category === 'Campaign & Leadership' || snapshot?.theme === 'campaign-navy' || (profile.name && (profile.name.toLowerCase().includes('sheriff') || profile.name.toLowerCase().includes('judge') || profile.name.toLowerCase().includes('trevino')));

  return [
    profile.heroImage ? `<link rel="preload" as="image" href="${escapeHtml(profile.heroImage)}" fetchpriority="high">` : '',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(metaDescription)}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta name="generator" content="Texas Sons Websites">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(metaDescription)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${escapeHtml(siteUrl)}/">`,
    profile.heroImage ? `<meta property="og:image" content="${escapeHtml(profile.heroImage)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="canonical" href="${escapeHtml(siteUrl)}/">`,
    profile.faviconUrl
      ? `<link rel="icon" type="${profile.faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'}" href="${escapeHtml(profile.faviconUrl)}">`
      : (isCampaign ? `<link rel="icon" type="image/svg+xml" href="/sheriff-badge-favicon.svg">` : `<link rel="icon" type="image/png" href="/favicon.png">`),
    `<script type="application/ld+json">${ld}</script>`,
  ].filter(Boolean).join('\n    ');
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

// Lazy-initialized Gemini AI client (shared across all AI endpoints)
let geminiClient: any = null;
async function getGemini() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    const { GoogleGenAI } = await import("@google/genai");
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return geminiClient;
}

async function generateGeminiWithRetry(options: { model: string; contents: any }, maxRetries = 3): Promise<any> {
  const ai = await getGemini();
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(options);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || err?.status === "RESOURCE_EXHAUSTED";

      if (isRateLimit && attempt < maxRetries) {
        let delayMs = attempt * 6000;
        try {
          const match = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retryDelay":"([0-9.]+)s"/i);
          if (match && match[1]) {
            delayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
          }
        } catch {}

        console.log(`[Gemini Rate Limit 429] Waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }

      if (isRateLimit) {
        throw new Error("Google AI Free Tier rate limit reached (250k tokens/min). Please wait ~10 seconds before trying again, or add billing to your Google AI Studio key.");
      }

      throw err;
    }
  }

  throw lastError;
}

// Lazy-initialized Supabase client for lead capture
let supabaseClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in .env.local");
    }
    supabaseClient = createSupabaseClient(url, anonKey);
  }
  return supabaseClient;
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
function pagesFileHash(data: string | Buffer, fileName: string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  const base64 = buf.toString('base64');
  const ext = path.extname(fileName).slice(1);
  const hash = blake3(new TextEncoder().encode(base64 + ext));
  return bytesToHex(hash).slice(0, 32);
}

function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const map: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

interface UploadEntry {
  path?: string;
  hash: string;
  data: string | Buffer;
  contentType: string;
}

async function uploadAssets(jwt: string, files: UploadEntry[]): Promise<void> {
  const payload = files.map(f => ({
    key: f.hash,
    value: typeof f.data === 'string' ? Buffer.from(f.data).toString('base64') : f.data.toString('base64'),
    metadata: { contentType: f.contentType },
    base64: true,
  }));
  await cfFetch(`https://api.cloudflare.com/client/v4/pages/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
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
  files: Record<string, string | Buffer>
): Promise<string> {
  const jwt = await getUploadJwt(accountId, apiToken, projectName);

  const entries: UploadEntry[] = Object.entries(files).map(([filePath, data]) => ({
    path: filePath,
    data,
    contentType: contentTypeFor(filePath),
    hash: pagesFileHash(data, filePath),
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

      const ai = await getGemini();

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

      const response = await generateGeminiWithRetry({
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

  // AI Proposal & Client Outreach Email Generator
  app.post("/api/draft-proposal", async (req, res) => {
    try {
      const { projectName, siteUrl, recipientName, tone, customNotes, snapshot } = req.body;
      const profile = snapshot?.profile || {};
      const services = snapshot?.services || [];
      const testimonials = snapshot?.testimonials || [];
      const events = snapshot?.events || [];
      const name = profile.name || projectName || 'Client Project';
      const tagline = profile.tagline || '';
      const phone = profile.phone || '';
      const email = profile.email || '';
      const address = profile.address || '';
      const treasurer = profile.treasurerName || '';

      const serviceList = services.map((s: any, idx: number) => `  ${idx + 1}. ${s.title}: ${s.description}`).join('\n');
      const reviewList = testimonials.map((t: any) => `  - "${t.quote}" — ${t.author} (${t.role || 'Verified'})`).join('\n');
      const eventList = events.map((e: any) => `  - ${e.name} (${e.date} at ${e.time}, ${e.location})`).join('\n');

      let toneGuidance = 'Professional, authoritative executive proposal presenting a modern marketing website and brand platform.';
      if (tone === 'campaign-presentation') {
        toneGuidance = 'Authoritative, constitutional political campaign presentation written to a candidate, campaign manager, or steering committee. Emphasize voter turnout, community trust, Medal of Valor law enforcement credibility, grassroots mobilization, and official election disclosures.';
      } else if (tone === 'agency-proposal') {
        toneGuidance = 'Polished digital agency pitch proposing high-performance web development, mobile-first design, SEO leadership, and conversion optimization.';
      } else if (tone === 'launch-handoff') {
        toneGuidance = 'Executive delivery handoff confirming site readiness, DNS/custom domain instructions, live admin portal access for leads and RSVPs, and pre-launch review.';
      } else if (tone === 'donor-outreach') {
        toneGuidance = 'Inspiring grassroots community outreach sharing the official platform, inviting community leaders to review the site, request yard signs, attend upcoming town halls, and endorse the movement.';
      }

      const prompt = `You are an elite political strategist and executive digital communications director for Texas Sons Websites.
Draft a high-impact, persuasive client presentation / proposal email for the following project:

PROJECT CONTEXT:
- Candidate / Business Name: ${name}
- Tagline / Mission: ${tagline}
- Contact HQ: ${phone} | ${email} | ${address}
- Official Campaign Treasurer: ${treasurer || 'Joseph S. Boyle'}
- Live Site URL: ${siteUrl || `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`}
- Key Pillars / Services:
${serviceList || '  1. Proactive Rural Public Safety & Crime Interdiction\n  2. Campus & School Security Taskforce\n  3. Fiscal Transparency & Taxpayer Accountability'}
- Official Endorsements & Citations:
${reviewList || '  - "Extraordinary courage under fire." — Retired SWAT Commander (SAPD Medal of Valor Recipient)'}
- Scheduled Public Events:
${eventList || '  - Jourdanton Community Town Hall (Oct 24, 2026)\n  - Sheriff Campaign BBQ Rally (Nov 02, 2026)'}

EMAIL OBJECTIVE & TONE:
${toneGuidance}

ADDITIONAL USER INSTRUCTIONS:
${customNotes || 'None provided'}

RECIPIENT NAME:
${recipientName || 'Campaign Leadership & Steering Committee'}

REQUIREMENTS:
1. Provide a sharp, high-open-rate Subject Line.
2. Structure the email logically with clean paragraphs, bullet points for key features, the live website demonstration link, and clear next steps.
3. Keep the tone refined, confident, and distinctly Texan without being cheesy.
4. Output ONLY a valid JSON object in this exact format (no markdown code blocks, no intro text):
{
  "subject": "...",
  "body": "..."
}`;

      try {
        const response = await generateGeminiWithRetry({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        let parsed: any = null;
        try {
          const raw = response.text || '';
          const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = null;
        }

        if (parsed && parsed.subject && parsed.body) {
          return res.json({ success: true, subject: parsed.subject, body: parsed.body });
        }
      } catch (aiErr) {
        console.warn('Gemini proposal draft fallback:', aiErr);
      }

      // Fallback deterministic generator
      const fallbackSubject = `${name} — Official Digital Platform & Campaign Proposal`;
      const fallbackBody = `Dear ${recipientName || 'Campaign Team'},\n\nWe are pleased to present the official digital campaign platform and website built for ${name}.\n\nYou can review the live, fully interactive platform here:\n👉 ${siteUrl || 'https://trevino-for-sheriff.pages.dev'}\n\nKey Platform Features Included in this Build:\n• Core Policy Platform & Priorities:\n${services.map((s: any) => `  - ${s.title}: ${s.description}`).slice(0, 3).join('\n') || '  - Proactive Narcotics Interdiction & Border Security\n  - School Safety & Campus Resource Deputies\n  - Jail Modernization & Fiscal Transparency'}\n\n• Verified Career Credentials & Endorsements:\n${testimonials.map((t: any) => `  - ${t.author} (${t.role}): "${t.quote}"`).slice(0, 2).join('\n') || '  - SAPD Medal of Valor Citation & Master Peace Officer Certification'}\n\n• Public Engagement & Voter Outreach:\n  - Live Atascosa County Voter Information Center & Polling Guide\n  - Community Town Hall & BBQ Rally RSVP System\n  - Yard Sign & Volunteer Intake Form (instant database sync)\n  - Official Texas Election Code § 255.001 Legal Disclosure (Treasurer: ${treasurer || 'Joseph S. Boyle'})\n\nPlease review the live site and let us know your feedback or if you would like to proceed with connecting your official domain name.\n\nRespectfully,\nTexas Sons Digital Platform Team\nhttps://texassons.dev | (512) 555-TEXAS`;

      res.json({ success: true, subject: fallbackSubject, body: fallbackBody });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Deploy compiled React client to Cloudflare Pages
  app.post("/api/deploy", async (req, res) => {
    try {
      const { projectName, currentSnapshot } = req.body;
      if (!currentSnapshot) {
        return res.status(400).json({ success: false, error: "currentSnapshot is required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName || currentSnapshot.profile.name);

      let project = await findPagesProject(accountId, apiToken, slug);
      if (!project) {
        project = await createPagesProject(accountId, apiToken, slug);
      }

      // Read client.html template
      const clientHtmlPath = path.join(process.cwd(), 'dist', 'client.html');
      let clientHtml = '';
      try {
        clientHtml = await fs.readFile(clientHtmlPath, 'utf8');
      } catch (err) {
        throw new Error("client.html not found. Did you run 'npm run build'?");
      }

      const siteUrl = `https://${slug}.pages.dev`;

      // Remove the boilerplate title (replaced by per-client SEO tags)
      clientHtml = clientHtml.replace(/<title>[\s\S]*?<\/title>/i, '');

      // Inject per-client SEO + the blueprint snapshot
      const blueprintJson = JSON.stringify(currentSnapshot).replace(/</g, '\\u003c');
      const injection = `${buildSeoTags(currentSnapshot, siteUrl)}\n  <script>window.__TXSONS_BLUEPRINT__ = ${blueprintJson};</script></head>`;
      const finalHtml = clientHtml.replace('</head>', injection);

      const files: Record<string, string | Buffer> = {
        'index.html': finalHtml,
        'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
        'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
      };

      // Favicon bundle
      for (const iconFile of ['favicon.png', 'sheriff-badge-favicon.svg', 'justice-scales-favicon.svg', 'smokehouse-flame-favicon.svg']) {
        try {
          const iconBuffer = await fs.readFile(path.join(process.cwd(), 'public', iconFile));
          files[iconFile] = iconBuffer;
        } catch {}
      }

      // Gather all compiled assets and public files copied to dist
      async function gatherFiles(dir: string, baseRoute: string = '') {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const routePath = baseRoute ? `${baseRoute}/${entry.name}` : entry.name;
            
            if (entry.isDirectory()) {
              await gatherFiles(fullPath, routePath);
            } else {
              // skip client.html / index.html / server.cjs as they are handled manually or not needed
              if (routePath === 'client.html' || routePath === 'index.html' || routePath === 'server.cjs' || routePath.endsWith('.map')) continue;
              const content = await fs.readFile(fullPath);
              files[routePath] = content;
            }
          }
        } catch (e) {
          console.log(`Error reading directory ${dir}:`, e);
        }
      }
      
      await gatherFiles(path.join(process.cwd(), 'dist'));

      const deploymentUrl = await uploadDeployment(accountId, apiToken, slug, files);

      res.json({
        success: true,
        url: siteUrl,
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
      const ai = await getGemini();

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

      const response = await generateGeminiWithRetry({
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

      const ai = await getGemini();

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
Analyze the provided asset(s) (which may be a PDF resume, restaurant menu, business card, campaign flyer, brochure, storefront photo, or marketing screenshot) and extract a comprehensive, production-ready website business dossier in valid JSON format.

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

      const response = await generateGeminiWithRetry({
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

  app.post("/api/studio-chat", async (req, res) => {
    try {
      const { prompt, currentSnapshot } = req.body;
      if (!prompt || !currentSnapshot) {
        return res.status(400).json({ success: false, error: "Missing prompt or currentSnapshot" });
      }

      // Strip any large base64 image data from the prompt snapshot to keep token usage minimal (<2k tokens)
      const originalHeroImage = currentSnapshot.profile?.heroImage;
      const originalLogoUrl = currentSnapshot.profile?.logoUrl;
      const sanitizedSnapshot = JSON.parse(JSON.stringify(currentSnapshot));

      if (typeof sanitizedSnapshot.profile?.heroImage === 'string' && sanitizedSnapshot.profile.heroImage.length > 500) {
        sanitizedSnapshot.profile.heroImage = '[PRESERVED_CLIENT_HERO_IMAGE]';
      }
      if (typeof sanitizedSnapshot.profile?.logoUrl === 'string' && sanitizedSnapshot.profile.logoUrl.length > 500) {
        sanitizedSnapshot.profile.logoUrl = '[PRESERVED_CLIENT_LOGO]';
      }

      const systemInstruction = `You are an expert React UI Architect and AI Agent working on the Texas Sons Builder platform.
Your job is to intelligently apply the user's requested modifications to the provided JSON state snapshot of their website.
You must return the COMPLETE updated JSON object matching the exact schema of the snapshot, modifying ONLY the relevant fields and preserving everything else.

FIELD MAPPING RULES:
1. Colors & Branding:
   - If user asks to change colors (e.g. "darker orange", "blue accent", "gold", "forest green"), update 'profile.accentColor' (e.g. #ea580c or #f97316 for orange, #2563eb for blue, #C5A059 for gold, #16a34a for green).
   - If user asks for dark background or theme change, update 'theme' and 'profile.theme'. Valid values: 'campaign-navy', 'crimson-bold', 'emerald-gold', 'luxury', 'dark', 'light', 'custom'.
2. Star Ratings & Badges:
   - If user asks to "remove star rating" or "remove ratings at top" or "hide reviews", set 'proofBadgeText' to "none".
   - If user asks to change or update badges, modify 'badges' array or 'proofBadgeText'.
3. Layout & Structure:
   - If user asks to change hero layout, update 'heroVariant'. Valid values: 'split', 'centered', 'bento'.
4. Content & Copy:
   - Headline / Tagline -> 'profile.tagline'
   - Bio / Story / Description -> 'profile.description'
   - Candidate / Business Name -> 'profile.name'
   - Contact info -> 'profile.phone', 'profile.email', 'profile.address', 'profile.hours'
   - Services / Pillars / Menu -> update 'services' array
   - Testimonials / Endorsements -> update 'testimonials' array

Return ONLY a valid JSON object. Do not include markdown ticks (\`\`\`json) or any explanation.

Current Snapshot:
${JSON.stringify(sanitizedSnapshot, null, 2)}

User Instruction:
${prompt}`;

      const response = await generateGeminiWithRetry({
        model: "gemini-3.6-flash",
        contents: systemInstruction
      });

      const rawText = response.text || "{}";
      const updatedSnapshot = parseJsonResponse(rawText);

      // Restore preserved image assets
      if (originalHeroImage && (!updatedSnapshot.profile?.heroImage || updatedSnapshot.profile.heroImage === '[PRESERVED_CLIENT_HERO_IMAGE]')) {
        if (!updatedSnapshot.profile) updatedSnapshot.profile = {};
        updatedSnapshot.profile.heroImage = originalHeroImage;
      }
      if (originalLogoUrl && (!updatedSnapshot.profile?.logoUrl || updatedSnapshot.profile.logoUrl === '[PRESERVED_CLIENT_LOGO]')) {
        if (!updatedSnapshot.profile) updatedSnapshot.profile = {};
        updatedSnapshot.profile.logoUrl = originalLogoUrl;
      }

      res.json({ success: true, snapshot: updatedSnapshot });
    } catch (error: any) {
      console.error("Studio Chat Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Public lead capture from deployed client sites
  app.post("/api/lead", async (req, res) => {
    try {
      const { businessName, siteSlug, name, phone, email, service, notes, address } = req.body || {};
      if (!name || !phone) {
        return res.status(400).json({ success: false, error: "name and phone are required" });
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.from('leads').insert({
        business_name: businessName || '',
        site_slug: siteSlug || '',
        name,
        phone,
        email: email || '',
        service: service || '',
        notes: notes || '',
        address: address || '',
        created_at: new Date().toISOString(),
      }).select('id').single();

      if (error) throw error;

      res.json({ success: true, leadId: data?.id });
    } catch (error: any) {
      console.error("Lead capture error:", error);
      res.status(500).json({ success: false, error: error.message });
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