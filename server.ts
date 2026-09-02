import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import express from "express";
import helmet from "helmet";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";
import { Octokit } from "@octokit/rest";
import Stripe from "stripe";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { requireAdmin, isPublicApiPath, isClientApiPath, type AuthedRequest } from './lib/auth';
import { isAllowedClientOrigin } from './lib/clientOrigins';
import {
  requireClientMember, requireClientOwner, requireClientSession, type ClientRequest,
} from './lib/clientAuth';
import {
  callModel, registerGeminiCaller, resolveModel, isAllowedAssistantModel,
  ASSISTANT_MODEL_CHOICES, logRoutingTable, parseModelJson, type ChatMessage,
} from './lib/models';
import { safeFetchText } from './lib/safeFetch';
import { buildInfo } from './lib/buildInfo';
import { checkEnv, logEnvStatus } from './lib/envCheck';
import { blueprintWithClientMedia, type MediaKind } from './lib/clientMedia';
import { mergeSnapshotEdit } from './lib/snapshotMerge';
import { stageOf } from './src/utils/clientStage';
import { vaultContextFor } from './lib/vault';

const TEMPLATES_ROOT = path.join(process.cwd(), 'public', 'templates');

interface SiteConfig {
  tokens: Record<string, string>;
  theme: Record<string, string>;
  seo: { title: string; description: string };
}

// ---------------------------------------------------------------------------
// Security & Path Traversal Guards (OWASP / CWE-22)
// ---------------------------------------------------------------------------

function sanitizeIdentifier(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid identifier provided');
  }
  // Strip any directory traversal sequences, slashes, or null bytes
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitized) {
    throw new Error('Identifier cannot be empty after sanitization');
  }
  return sanitized;
}

function safeResolvePath(baseDir: string, ...segments: string[]): string {
  const resolvedBase = path.resolve(baseDir);
  const safeSegments = segments.map(s => path.normalize(s).replace(/^(\.\.[\/\\])+/, ''));
  const resolvedTarget = path.resolve(resolvedBase, ...safeSegments);
  
  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error('Security Violation: Path traversal attempt detected');
  }
  return resolvedTarget;
}

// ---------------------------------------------------------------------------
// Shared template engine
// ---------------------------------------------------------------------------

async function loadManifest(templateId: string): Promise<any> {
  const safeId = sanitizeIdentifier(templateId);
  const manifestPath = safeResolvePath(TEMPLATES_ROOT, safeId, 'manifest.json');
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
  const safeTemplateId = sanitizeIdentifier(templateId);
  const safeVersionId = sanitizeIdentifier(versionId);
  const manifest = await loadManifest(safeTemplateId);
  const versionFiles = manifest.versions?.[safeVersionId];
  const templateDir = safeResolvePath(TEMPLATES_ROOT, safeTemplateId);
  const desktopFilename = path.basename(versionFiles?.desktop || `${safeVersionId}-desktop.html`);
  const mobileFilename = path.basename(versionFiles?.mobile || `${safeVersionId}-mobile.html`);
  const desktopFile = safeResolvePath(templateDir, desktopFilename);
  const mobileFile = safeResolvePath(templateDir, mobileFilename);

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
  if (includeAdmin && safeTemplateId !== 'universal-admin') {
    const adminFile = safeResolvePath(TEMPLATES_ROOT, 'admin', 'universal-admin.html');
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

  const isCampaign = profile.category === 'Campaign & Leadership' || snapshot?.theme === 'campaign-navy' || snapshot?.theme === 'campaign-judicial' || (profile.name && (profile.name.toLowerCase().includes('sheriff') || profile.name.toLowerCase().includes('judge') || profile.name.toLowerCase().includes('trevino')));

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

async function generateGeminiWithRetry(options: { model?: string; contents: any }, maxRetries = 3): Promise<any> {
  const ai = await getGemini();
  let modelName = options.model || "gemini-3.6-flash";
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        ...options,
        model: modelName
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);

      // Model fallback if 404 / NOT_FOUND / no longer available
      if (errMsg.includes("404") || errMsg.includes("NOT_FOUND") || errMsg.includes("no longer available")) {
        if (modelName === "gemini-2.5-flash") {
          modelName = "gemini-3.6-flash";
          console.log(`[Gemini Fallback] Switching model to ${modelName}...`);
          continue;
        } else if (modelName === "gemini-3.6-flash") {
          modelName = "gemini-2.5-flash";
          console.log(`[Gemini Fallback] Switching model to ${modelName}...`);
          continue;
        }
      }

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

// Lazy-initialized Supabase client (anon key — subject to RLS)
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

/**
 * Server-side admin client. Uses the service-role key, which BYPASSES RLS.
 *
 * Why this exists: the server is a trusted context, but it was talking to
 * Supabase with the public anon key. That meant server-side writes were subject
 * to the same row-level policies as an anonymous browser — which is why
 * /api/lead broke the moment `leads` was locked down, and why a public intake
 * portal could not write anything at all. Working around it by granting `anon`
 * write policies also hands that same write access to anyone who reads the key
 * out of the browser bundle.
 *
 * NEVER expose this key to the client. It must not carry a VITE_ prefix (Vite
 * inlines those into the browser bundle) and must never be returned in a
 * response.
 *
 * Falls back to the anon client when unset, so the app still boots — but logs
 * loudly, because the public write paths will fail under RLS.
 */
let supabaseAdminClient: SupabaseClient | null = null;
let warnedAboutMissingServiceRole = false;
function getSupabaseAdmin(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    if (!warnedAboutMissingServiceRole) {
      console.warn(
        '[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon key. ' +
        'Public write paths (/api/lead, intake portal) will fail if RLS denies anon. ' +
        'Add it to .env.local; see .env.example.'
      );
      warnedAboutMissingServiceRole = true;
    }
    return getSupabase();
  }

  if (!supabaseAdminClient) {
    const url = process.env.VITE_SUPABASE_URL;
    if (!url) throw new Error('VITE_SUPABASE_URL is required in .env.local');
    supabaseAdminClient = createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdminClient;
}

// The router delegates Gemini calls back here so the retry logic and client
// setup are not duplicated in lib/models.ts.
registerGeminiCaller(opts => generateGeminiWithRetry(opts));
logRoutingTable();

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

async function addPagesDomain(
  accountId: string,
  apiToken: string,
  projectName: string,
  domainName: string
): Promise<any> {
  return cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: domainName }),
  });
}

async function listPagesDomains(
  accountId: string,
  apiToken: string,
  projectName: string
): Promise<any[]> {
  try {
    const res = await cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function getPagesDomainStatus(
  accountId: string,
  apiToken: string,
  projectName: string,
  domainName: string
): Promise<any> {
  return cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domainName}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
}

async function deletePagesDomain(
  accountId: string,
  apiToken: string,
  projectName: string,
  domainName: string
): Promise<any> {
  return cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domainName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
}

async function listPagesDeployments(
  accountId: string,
  apiToken: string,
  projectName: string
): Promise<any[]> {
  try {
    const res = await cfFetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Security Headers via Helmet (OWASP / Aikido standard)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://maps.googleapis.com",
            "https://js.stripe.com",
            "https://cdn.tailwindcss.com"
          ],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "https://*.google.com",
            "https://*.googleapis.com",
            "https://*.gstatic.com",
            "https://images.unsplash.com"
          ],
          connectSrc: [
            "'self'",
            "https://*.supabase.co",
            "https://maps.googleapis.com",
            "https://places.googleapis.com",
            "https://api.stripe.com",
            "ws:",
            "wss:"
          ],
          frameSrc: [
            "'self'",
            "https://js.stripe.com",
            // Square Appointments booking, embedded on client sites so the
            // visitor never leaves the salon's own page to book. Frame-src only:
            // this is an iframe of the seller's existing booking site, not the
            // Web Payments SDK. Taking card details directly would additionally
            // need Square's CDN in script-src and connect-src — do not add those
            // until something actually uses them.
            "https://*.squareup.com",
            "https://*.square.site",
            "https://*.pages.dev",
            "http://localhost:*"
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: null
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // -------------------------------------------------------------------------
  // Admin gate — every /api route requires a valid Supabase session whose email
  // is on the allowlist, except the two that are public by design:
  //   /api/health  liveness probe
  //   /api/lead    form submissions from DEPLOYED client sites (cross-origin,
  //                no session available). TODO: rate-limit + captcha this one.
  // Mounted before the route definitions so nothing can be added behind its back.
  // -------------------------------------------------------------------------
  // isPublicApiPath lives in lib/auth.ts so scripts/smoke-security.ts can assert
  // it in CI — notably that '/intake/' does not also open '/intake-link'.
  // CORS for deployed client sites, which live on Cloudflare Pages and are
  // therefore cross-origin to this server. Mounted before the auth gate so a
  // preflight is answered rather than challenged for a token it cannot carry.
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedClientOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      // Vary matters here: without it a cache can hand one origin's allowance
      // to another and produce failures nobody can reproduce.
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
      // Deliberately NOT Allow-Credentials. Sessions travel as Bearer tokens
      // read from the page's own storage, so no cookie needs to cross origins,
      // and allowing credentials would widen this for no gain.
    }
    if (req.method === 'OPTIONS') {
      // An unallowed origin gets a preflight with no CORS headers, which the
      // browser rejects. That is the correct outcome and needs no status of
      // its own.
      return res.sendStatus(204);
    }
    next();
  });

  app.use('/api', (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (isPublicApiPath(req.path)) return next();
    // Client users are authenticated but not operators. Their routes carry
    // their own per-project gate (requireClientMember, mounted on each route);
    // sending them through requireAdmin would reject every one of them, since
    // no salon owner is on the operator allowlist. Skipping the admin gate here
    // is only safe because every /api/client/ route mounts that gate itself —
    // scripts/smoke-security.ts asserts that none is left bare.
    if (isClientApiPath(req.path)) return next();
    return requireAdmin(req, res, next);
  });

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

  // Public, and deliberately so — it is the liveness probe, and it has to
  // answer without a session.
  //
  // Build identity only. Which credentials are missing is NOT reported here:
  // this endpoint is unauthenticated, and a public list of unconfigured
  // integrations is a map of where a deployment is weakest, even with no values
  // attached. That lives behind the admin gate on /api/env-status.
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", ...buildInfo() });
  });

  // Admin-gated, because the answer names which integrations are unconfigured.
  // Presence and shape only — never a value. See lib/envCheck.ts.
  app.get("/api/env-status", (req, res) => {
    res.json({ success: true, build: buildInfo(), env: checkEnv() });
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
      const safeTemplateId = sanitizeIdentifier(templateId);
      const safeVersionId = sanitizeIdentifier(versionId);

      const manifest = await loadManifest(safeTemplateId);
      const versionFiles = manifest.versions?.[safeVersionId];
      const templateDir = safeResolvePath(TEMPLATES_ROOT, safeTemplateId);

      let html = '';
      try {
        const desktopFilename = path.basename(versionFiles?.desktop || `${safeVersionId}-desktop.html`);
        html += await fs.readFile(safeResolvePath(templateDir, desktopFilename), 'utf8');
      } catch {}
      try {
        const mobileFilename = path.basename(versionFiles?.mobile || `${safeVersionId}-mobile.html`);
        html += await fs.readFile(safeResolvePath(templateDir, mobileFilename), 'utf8');
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

      const response = await callModel({ task: 'generate-config', prompt });

      let aiConfig: any = {};
      try {
        aiConfig = parseModelJson(response);
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
        const response = await callModel({ task: 'draft-proposal', prompt });

        // Kept tolerant on purpose: both these routes fall back to a
        // hand-written template when the model does not produce usable JSON,
        // so a parse failure must not throw past this block.
        let parsed: any = null;
        try {
          parsed = parseModelJson(response);
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
      let fallbackSubject = `${name} — Official Digital Platform & Presentation`;
      let fallbackBody = '';
      const firstName = (recipientName || 'there').split(' ')[0];

      if (tone === 'agency-proposal') {
        fallbackSubject = `Website Demo & Digital Platform Preview for ${name}`;
        fallbackBody = `Hi ${firstName},

I put together a live interactive website demo for ${name} to show you how a modern, high-performance web platform can support your outreach and showcase your record.

You can preview the live working demo directly on your phone or computer:
👉 ${siteUrl || 'https://trevino-for-sheriff.pages.dev'}

Key features built into this demo:
• Mobile-First Design & Speed: Optimized for voters and supporters on smartphones.
• Core Platform & Priorities: Clear presentation of your 3 key platform pillars and background.
• Interactive Community Tools: Built-in event schedule (town halls/rallies), voter info guide, and 1-click yard sign and volunteer intake forms.
• Official Campaign Branding: High-authority gold & navy design tokens with official election legal disclosures.

Would you be open to a quick 10-minute call or meeting this week so I can walk you through the demo and get your thoughts?

Best regards,
Morgan
Texas Sons Web Development & Digital Strategy
(512) 555-TEXAS | contact.txsons@gmail.com`;
      } else if (tone === 'launch-handoff') {
        fallbackSubject = `${name} — Website Launch & Domain Handoff Ready`;
        fallbackBody = `Dear ${recipientName || 'Campaign Leadership'},

Your official digital platform for ${name} has passed pre-flight quality assurance and is ready for final launch!

Review the live staging site here:
👉 ${siteUrl || 'https://trevino-for-sheriff.pages.dev'}

Launch Checklist & Deliverables:
✓ Mobile & Desktop Responsive Design verified
✓ Voter Information Center & Polling Location route active (#voting)
✓ Community Events & RSVP engine connected (#events)
✓ Lead & Volunteer Database capture verified with instant admin portal access
✓ Legal Campaign Disclaimer configured (Treasurer: ${treasurer || 'Joseph S. Boyle'})

Next Steps:
Please reply to confirm approval, and we will connect your official custom domain name.

Respectfully,
Texas Sons Digital Platform Team
(512) 555-TEXAS | https://texassons.dev`;
      } else if (tone === 'donor-outreach') {
        fallbackSubject = `Join our movement — Official Campaign Platform for ${name}`;
        fallbackBody = `Dear Community Leader,

We are excited to share the official campaign platform for ${name} with trusted leaders across Atascosa County.

Explore the official campaign website here:
👉 ${siteUrl || 'https://trevino-for-sheriff.pages.dev'}

With over 28 years of dedicated Texas law enforcement service, Master Peace Officer certification, and the SAPD Medal of Valor, Ernest Trevino is committed to proactive crime interdiction, school safety, and constitutional integrity.

How You Can Support:
• Request a Campaign Yard Sign directly on the site
• RSVP for our upcoming Community Town Hall & BBQ Fundraiser
• Sign up to join our grassroots volunteer coalition

Thank you for your continued leadership and support.

Respectfully,
Ernest Trevino Campaign Team
Campaign HQ: Jourdanton, TX | (830) 555-VOTE`;
      } else {
        fallbackSubject = `${name} — Official Digital Campaign Platform & Presentation`;
        fallbackBody = `Dear ${recipientName || 'Campaign Leadership'},\n\nWe are pleased to present the official live digital campaign platform and website built for ${name}.\n\nYou can review the live, fully interactive platform here:\n👉 ${siteUrl || 'https://trevino-for-sheriff.pages.dev'}\n\nKey Highlights Included in This Build:\n• Core Policy Platform & Pillars:\n${services.map((s: any) => `  - ${s.title}: ${s.description}`).slice(0, 3).join('\n') || '  - Proactive Violent Crime & Cartel Narcotics Interdiction\n  - School & Campus Safety Taskforce\n  - Modernized Jail Operations & Taxpayer Fiscal Accountability'}\n\n• Verified Career Credentials & Endorsements:\n${testimonials.map((t: any) => `  - ${t.author} (${t.role}): "${t.quote}"`).slice(0, 2).join('\n') || '  - SAPD Medal of Valor Tactical Leadership Citation\n  - 28+ Years Texas Law Enforcement & Certified Master Peace Officer'}\n\n• Public Voter Engagement & Mobilization:\n  - Live Atascosa County Voter Information Center & Polling Guide\n  - Community Town Hall & BBQ Rally RSVP System\n  - Instant Yard Sign & Grassroots Volunteer Intake (Direct Database Sync)\n  - Official Legal Political Advertising Disclaimer (Treasurer: ${treasurer || 'Joseph S. Boyle'})\n\nPlease review the live site and let us know your feedback so we can connect your official domain.\n\nRespectfully,\nTexas Sons Digital Platform Team\nhttps://texassons.dev | (512) 555-TEXAS`;
      }

      res.json({ success: true, subject: fallbackSubject, body: fallbackBody });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Client Contract & Legal Agreement Drafter
  app.post("/api/draft-contract", async (req, res) => {
    try {
      const { clientName, companyName, contractType, totalAmount, depositAmount, timeline, deliverables, customClauses, snapshot } = req.body;
      const profile = snapshot?.profile || {};
      const name = companyName || profile.name || 'Client';
      const contact = clientName || profile.name || 'Authorized Client Representative';
      const treasurer = profile.treasurerName || 'Joseph S. Boyle';
      const domain = `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`;
      const isCampaign = contractType === 'campaign-platform' || name.toLowerCase().includes('sheriff') || name.toLowerCase().includes('judge') || name.toLowerCase().includes('campaign');

      const total = Number(totalAmount) || (isCampaign ? 1495 : 995);
      const deposit = Number(depositAmount) || Math.round(total * 0.5);
      const remaining = total - deposit;
      const deliverableList = Array.isArray(deliverables) && deliverables.length > 0
        ? deliverables.map((d: string, i: number) => `  ${i + 1}. ${d}`).join('\n')
        : (isCampaign 
            ? '  1. Single-Page Responsive Campaign Web Platform (Mobile & Desktop)\n  2. Atascosa County Voter Information Center & Polling Location Guide (#voting)\n  3. Public Community Events & Town Hall / BBQ RSVP System (#events)\n  4. Grassroots Volunteer & Yard Sign Intake Form with real-time database sync\n  5. Texas Election Code § 255.001 Political Advertising Legal Compliance Integration\n  6. 1-Click Cloudflare Pages Global Edge CDN Hosting & SSL Certificate Configuration'
            : '  1. Single-Page Responsive High-Conversion Business Website\n  2. Custom Service Matrix & Interactive Booking / Lead Intake Engine\n  3. Google Maps Platform & Local Business SEO Schema Markup\n  4. Mobile-Optimized Performance & Cloudflare Edge CDN Hosting\n  5. Domain Name Connection & Custom SSL Security Certificate');

      const prompt = `You are a legal counsel and contract specialist for Texas Sons Web Development & Digital Strategy.
Draft a professional, legally structured, comprehensive Independent Contractor Services Agreement governed by the laws of the State of Texas for the following project:

CLIENT & PROJECT INFORMATION:
- Agency: Texas Sons Web Development & Digital Strategy (Austin / South Texas)
- Client Entity / Campaign: ${name}
- Authorized Client Signer: ${contact}
- Campaign Treasurer (if political): ${treasurer}
- Project Type: ${isCampaign ? 'Official Political Campaign Digital Platform & Voter Mobilization Web App' : 'Commercial Marketing Website & Lead Generation Engine'}
- Delivery Timeline: ${timeline || '3 to 5 business days upon receipt of initial deposit and client assets'}
- Total Project Investment: $${total.toLocaleString()} USD
- Initial Deposit Due Upon Signing: $${deposit.toLocaleString()} USD
- Remaining Balance Due Upon Staging Approval: $${remaining.toLocaleString()} USD
- Live Demonstration / Staging URL: ${domain}
- Included Deliverables:
${deliverableList}
- Special Terms / Custom Scope:
${customClauses || 'None specified'}

CONTRACT STRUCTURE REQUIRED:
1. TITLE: MASTER SERVICES AGREEMENT (${isCampaign ? 'POLITICAL CAMPAIGN DIGITAL PLATFORM' : 'WEB DEVELOPMENT & DEPLOYMENT'})
2. SECTION 1: ENGAGEMENT & SCOPE OF WORK (List itemized deliverables)
3. SECTION 2: TIMELINE, DELIVERY & MILESTONES
4. SECTION 3: COMPENSATION & PAYMENT TERMS (50% deposit upon signature, 50% upon final staging delivery prior to custom domain cutover)
5. SECTION 4: INTELLECTUAL PROPERTY & ASSET OWNERSHIP (Client retains ownership of all trademarks, photos, copy; Agency grants perpetual irrevocable license to deployed code)
6. SECTION 5: STATUTORY & LEGAL COMPLIANCE ${isCampaign ? '(Explicit compliance with Texas Election Code § 255.001, political advertising disclosures, and Treasurer authorization)' : '(Warranties of non-infringement and standard commercial disclaimers)'}
7. SECTION 6: CLIENT RESPONSIBILITIES & REVIEW WINDOW (3 business days for staging feedback)
8. SECTION 7: WARRANTIES & LIMITATION OF LIABILITY
9. SECTION 8: GOVERNING LAW & VENUE (State of Texas)
10. SECTION 9: ENTIRE AGREEMENT & AMENDMENTS
11. FORMAL SIGNATURE BLOCKS for both Client and Texas Sons Authorized Representative.

Return ONLY a JSON object in this format (no markdown blocks, no intro text):
{
  "title": "Master Services Agreement — ${name}",
  "contractText": "Full formatted text of the agreement..."
}`;

      try {
        const response = await callModel({ task: 'draft-contract', prompt });

        // Kept tolerant on purpose: both these routes fall back to a
        // hand-written template when the model does not produce usable JSON,
        // so a parse failure must not throw past this block.
        let parsed: any = null;
        try {
          parsed = parseModelJson(response);
        } catch {
          parsed = null;
        }

        if (parsed && parsed.contractText) {
          return res.json({ success: true, title: parsed.title || `Services Agreement — ${name}`, contractText: parsed.contractText });
        }
      } catch (aiErr) {
        console.warn('Gemini contract draft fallback:', aiErr);
      }

      // Deterministic Contract Generator
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const contractTitle = isCampaign 
        ? `CAMPAIGN DIGITAL PLATFORM MASTER SERVICES AGREEMENT` 
        : `WEB DEVELOPMENT & DIGITAL SERVICES AGREEMENT`;

      const fallbackContract = `================================================================================
${contractTitle}
TEXAS SONS WEB DEVELOPMENT & DIGITAL STRATEGY
================================================================================

EFFECTIVE DATE: ${dateStr}

PARTIES:
This Master Services Agreement ("Agreement") is entered into by and between:
1. AGENCY: Texas Sons Web Development & Digital Strategy ("Agency"), and
2. CLIENT: ${name} ("Client"), represented by ${contact}.

WHEREAS, Client desires to retain Agency to design, develop, test, and deploy a custom digital web platform, and Agency agrees to perform such services under the terms and conditions outlined herein.

NOW, THEREFORE, the Parties agree as follows:

--------------------------------------------------------------------------------
SECTION 1: SCOPE OF SERVICES & DELIVERABLES
--------------------------------------------------------------------------------
Agency agrees to execute and deliver the following digital assets and services:
${deliverableList}

Staging & Demonstration URL: ${domain}

--------------------------------------------------------------------------------
SECTION 2: PROJECT TIMELINE & MILESTONES
--------------------------------------------------------------------------------
1. Kickoff & Asset Ingestion: Within 24 hours of initial deposit.
2. Staging Deployment: Estimated within ${timeline || '3 to 5 business days'} following receipt of initial deposit and required branding assets.
3. Client Review Window: Client shall have 3 business days to submit written revision requests.
4. Final Launch & Domain Connection: Within 24 hours of final milestone approval.

--------------------------------------------------------------------------------
SECTION 3: COMPENSATION & PAYMENT TERMS
--------------------------------------------------------------------------------
1. Total Contract Investment: $${total.toLocaleString()} USD
2. Initial Deposit (50%): $${deposit.toLocaleString()} USD (Due upon execution of this Agreement prior to development).
3. Final Milestone Balance (50%): $${remaining.toLocaleString()} USD (Due upon staging approval prior to final custom domain deployment).
4. Payment Methods: Stripe secure digital checkout, ACH bank transfer, or authorized campaign check.

--------------------------------------------------------------------------------
SECTION 4: INTELLECTUAL PROPERTY & OWNERSHIP
--------------------------------------------------------------------------------
1. Client Materials: Client retains full, exclusive ownership of all logos, photographs, campaign biographies, and trademarked materials provided to Agency.
2. Deployed Deliverables: Upon full payment of the Total Contract Investment, Agency assigns to Client a perpetual, irrevocable, worldwide license to use, display, and maintain the deployed digital platform.
3. Agency Tools: Agency retains ownership of its proprietary deployment toolchains, reusable component templates, and build engines.

--------------------------------------------------------------------------------
SECTION 5: LEGAL & REGULATORY COMPLIANCE
--------------------------------------------------------------------------------
${isCampaign 
  ? `1. Political Advertising Disclosure: All campaign web pages shall prominently display official political advertising disclosures in accordance with Texas Election Code § 255.001.
2. Campaign Treasurer Authorization: This Agreement and digital assets are authorized by Campaign Treasurer ${treasurer}.
3. Compliance Responsibility: Client confirms all biographical claims, endorsements, and voter information conform with Texas Ethics Commission rules.`
  : `1. Commercial Non-Infringement: Client warrants that all text, imagery, and trade names provided do not infringe on third-party intellectual property.
2. Data Privacy: Client agrees to comply with standard state consumer privacy and commercial data regulations.`}

--------------------------------------------------------------------------------
SECTION 6: WARRANTIES & LIMITATION OF LIABILITY
--------------------------------------------------------------------------------
1. 30-Day Quality Warranty: Agency warrants that the digital platform shall perform in substantial compliance with modern web standards (Chrome, Safari, Firefox, iOS, Android) for 30 days following launch.
2. Limitation of Liability: In no event shall Agency's aggregate liability under this Agreement exceed the Total Contract Investment paid by Client.

--------------------------------------------------------------------------------
SECTION 7: GOVERNING LAW & DISPUTE RESOLUTION
--------------------------------------------------------------------------------
This Agreement shall be construed and governed in accordance with the laws of the State of Texas. Any legal proceedings arising from this Agreement shall be resolved in the appropriate state courts of Texas.

--------------------------------------------------------------------------------
SECTION 8: SPECIAL CONDITIONS & CUSTOM SCOPE
--------------------------------------------------------------------------------
${customClauses || 'Standard execution per Texas Sons quality standards. Hosting and Cloudflare Edge SSL security included.'}

================================================================================
EXECUTION & SIGNATURES
================================================================================
IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of the Effective Date written above.

CLIENT / CANDIDATE:

Signature: _________________________________________  Date: ____________________

Printed Name: ${contact}

Title / Office: ${isCampaign ? 'Candidate / Campaign Steering Committee' : 'Authorized Business Representative'}

Organization: ${name}


TEXAS SONS AGENCY REPRESENTATIVE:

Signature: _________________________________________  Date: ____________________

Printed Name: Morgan / Authorized Agent

Title: Principal Director, Texas Sons Web Development & Digital Strategy

================================================================================`;

      res.json({
        success: true,
        title: `${contractTitle} — ${name}`,
        contractText: fallbackContract
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Deploy compiled React client to Cloudflare Pages
  /**
   * Builds and uploads a site from a finished blueprint.
   *
   * Shared by /api/deploy and the portal's auto-redeploy so a client saving a
   * photo produces exactly the same output as the operator pressing Deploy.
   * Two copies of this would drift, and the drift would only show up on a
   * client's live site.
   */
  /**
   * Builds the page a deploy uploads, without uploading it.
   *
   * Split out of publishBlueprint so the true preview and the real deploy
   * produce the same bytes from the same code. Parity used to be maintained by
   * hand — a second render path in the Studio kept in step with this one — and
   * it drifted four separate times: a hardcoded block list, unmerged client
   * media, window-measured breakpoints, and unset theme variables. Every one was
   * found by the operator noticing the live site did not match what they had
   * approved. One code path cannot drift.
   *
   * `preview` is the single deliberate difference: it marks the page so the
   * lead form does not file real enquiries from a page nobody has published.
   */
  async function buildSiteHtml(
    siteName: string,
    blueprint: any,
    opts: { preview?: boolean } = {}
  ): Promise<{ html: string; siteUrl: string; slug: string }> {
    const slug = sanitizeProjectName(siteName || blueprint?.profile?.name);

    const clientHtmlPath = path.join(process.cwd(), 'dist', 'client.html');
    let clientHtml = '';
    try {
      clientHtml = await fs.readFile(clientHtmlPath, 'utf8');
    } catch {
      throw new Error("client.html not found. Did you run 'npm run build'?");
    }

    const siteUrl = `https://${slug}.pages.dev`;
    clientHtml = clientHtml.replace(/<title>[\s\S]*?<\/title>/i, '');

    const blueprintJson = JSON.stringify(blueprint).replace(/</g, '\\u003c');

    // Where this site's API lives.
    //
    // A deployed site is static files on Cloudflare Pages, so a relative
    // /api/lead resolves to the Pages host, where no such route exists. Every
    // lead form on every deployed site was posting into nothing — and the form
    // still showed its success state, because the failure happened after the
    // component had congratulated the visitor.
    //
    // Injected rather than baked into the bundle at build time so one build
    // serves local development and production without a rebuild.
    const apiBase = (process.env.APP_URL || '').replace(/\/+$/, '');
    if (!apiBase) {
      // Not fatal — the site still renders, and a same-origin fallback is
      // correct in local development. Loud, because on a real deploy it means
      // the lead form is silently inert.
      console.warn('[deploy] APP_URL is not set — the deployed site will post leads to itself and lose them.');
    }
    const apiJson = JSON.stringify(apiBase).replace(/</g, '\\u003c');

    const previewFlag = opts.preview ? 'window.__TXSONS_PREVIEW__ = true;' : '';
    const injection = `${buildSeoTags(blueprint, siteUrl)}\n  <script>window.__TXSONS_BLUEPRINT__ = ${blueprintJson};window.__TXSONS_API__ = ${apiJson};${previewFlag}</script></head>`;
    const html = clientHtml.replace('</head>', injection);
    return { html, siteUrl, slug };
  }

  async function publishBlueprint(siteName: string, blueprint: any): Promise<{ siteUrl: string; deploymentUrl: string; slug: string }> {
    const { accountId, apiToken } = getCloudflareCredentials();
    const { html: finalHtml, siteUrl, slug } = await buildSiteHtml(siteName, blueprint);

    let project = await findPagesProject(accountId, apiToken, slug);
    if (!project) project = await createPagesProject(accountId, apiToken, slug);

    const files: Record<string, string | Buffer> = {
      'index.html': finalHtml,
      'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
    };

    const PUBLIC_DIR = safeResolvePath(process.cwd(), 'public');
    for (const iconFile of ['favicon.png', 'sheriff-badge-favicon.svg', 'justice-scales-favicon.svg', 'smokehouse-flame-favicon.svg']) {
      try {
        files[iconFile] = await fs.readFile(safeResolvePath(PUBLIC_DIR, path.basename(iconFile)));
      } catch {}
    }

    const DIST_DIR = safeResolvePath(process.cwd(), 'dist');
    async function gatherFiles(dir: string, baseRoute: string = '') {
      try {
        const safeDirPath = safeResolvePath(dir);
        const entries = await fs.readdir(safeDirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = safeResolvePath(safeDirPath, path.basename(entry.name));
          const routePath = baseRoute ? `${baseRoute}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            await gatherFiles(fullPath, routePath);
          } else {
            if (routePath === 'client.html' || routePath === 'index.html' || routePath === 'server.cjs' || routePath.endsWith('.map')) continue;
            files[routePath] = await fs.readFile(fullPath);
          }
        }
      } catch (e) {
        console.log(`Error reading directory ${dir}:`, e);
      }
    }
    await gatherFiles(DIST_DIR);

    const deploymentUrl = await uploadDeployment(accountId, apiToken, slug, files);
    return { siteUrl, deploymentUrl, slug };
  }

  /**
   * Preview builds, held in memory until they are looked at.
   *
   * Keyed by an unguessable id rather than by project, because the page is
   * served without a session: an iframe sends no Authorization header, so a
   * URL behind the admin gate could only ever 401. Short-lived, so a link that
   * escapes is worth nothing later, and capped, so a long editing session
   * cannot grow the process without bound.
   */
  const previewBuilds = new Map<string, { html: string; expires: number }>();
  const PREVIEW_TTL_MS = 15 * 60 * 1000;
  /** How many published versions of one site to keep. See recordBlueprintVersion. */
const BLUEPRINT_VERSION_CAP = 30;

const PREVIEW_MAX = 40;

  function storePreview(html: string): string {
    const now = Date.now();
    for (const [key, value] of previewBuilds) {
      if (value.expires <= now) previewBuilds.delete(key);
    }
    while (previewBuilds.size >= PREVIEW_MAX) {
      const oldest = previewBuilds.keys().next().value;
      if (oldest === undefined) break;
      previewBuilds.delete(oldest);
    }
    const id = crypto.randomBytes(24).toString('hex');
    previewBuilds.set(id, { html, expires: now + PREVIEW_TTL_MS });
    return id;
  }

  /**
   * Builds the page a deploy would upload and hands back a URL to look at it.
   *
   * The Studio's other preview renders the blueprint through React in the
   * operator's own app, which is useful for editing but is not the deployed
   * page: it has the app's fonts, the app's document head, no SEO, and no
   * ClientApp wrapper. This route runs the deploy's own builder and returns
   * the result, so what the operator approves is what the client receives.
   */
  app.post("/api/preview", async (req, res) => {
    try {
      const { projectName, currentSnapshot, projectId } = req.body;
      if (!currentSnapshot) {
        return res.status(400).json({ success: false, error: "currentSnapshot is required" });
      }

      // The same merge the deploy performs, in the same order. A preview that
      // skipped it would be missing exactly the photos the client uploaded,
      // which is the discrepancy this whole route exists to end.
      let snapshot = currentSnapshot;
      if (projectId) {
        const { blueprint } = await blueprintWithClientMedia(
          getSupabaseAdmin(), String(projectId), currentSnapshot
        );
        snapshot = blueprint;
      }

      const { html, siteUrl } = await buildSiteHtml(
        projectName || currentSnapshot.profile?.name, snapshot, { preview: true }
      );
      res.json({ success: true, url: `/__preview/${storePreview(html)}`, siteUrl });
    } catch (error: any) {
      console.error('Preview error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** Serves a built preview. Outside /api deliberately — see storePreview. */
  app.get('/__preview/:id', (req, res) => {
    const id = String(req.params.id);
    const build = previewBuilds.get(id);
    if (!build || build.expires <= Date.now()) {
      previewBuilds.delete(id);
      return res.status(404).type('html').send(
        '<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;padding:2rem;color:#78716c">' +
        'This preview expired. Switch tabs and back to build a fresh one.</body>'
      );
    }
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(build.html);
  });

  /**
   * Appends a published blueprint to the history.
   *
   * Never throws. Called from inside a successful deploy, where the site is
   * already live and the only remaining question is whether we can undo it
   * later — a failure here must be visible in the log and invisible to the
   * operator, who cannot act on it and whose deploy did work.
   */
  async function recordBlueprintVersion(
    projectId: string,
    ownerId: string | undefined,
    blueprint: any,
    label: string
  ): Promise<void> {
    if (!ownerId) {
      console.warn('[versions] no user on the request — version not recorded.');
      return;
    }
    try {
      const db = getSupabaseAdmin();
      const { error } = await db.from('blueprint_versions').insert({
        project_id: projectId,
        owner_id: ownerId,
        blueprint,
        label: label.slice(0, 200),
      });
      if (error) {
        console.error('[versions] could not record this deploy:', error.message);
        return;
      }

      // Retention. A blueprint is a large document and every deploy writes one,
      // so this grows without a bound nobody would notice until it mattered.
      // Thirty is far more than anyone scrolls back through and small enough to
      // stay cheap.
      const { data: old } = await db
        .from('blueprint_versions')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(BLUEPRINT_VERSION_CAP, BLUEPRINT_VERSION_CAP + 200);

      if (old?.length) {
        await db.from('blueprint_versions').delete().in('id', old.map((r: any) => r.id));
      }
    } catch (err: any) {
      console.error('[versions] could not record this deploy:', err?.message || err);
    }
  }

  app.post("/api/deploy", async (req, res) => {
    try {
      const { projectName, currentSnapshot, projectId } = req.body;
      if (!currentSnapshot) {
        return res.status(400).json({ success: false, error: "currentSnapshot is required" });
      }

      // Fold in anything the client uploaded through their portal. Their media
      // lives in its own table so the Studio cannot overwrite it; this is the
      // only place the two are combined.
      let snapshot = currentSnapshot;
      if (projectId) {
        const { blueprint, applied } = await blueprintWithClientMedia(
          getSupabaseAdmin(), String(projectId), currentSnapshot
        );
        snapshot = blueprint;
        const total = applied.portfolio + applied.beforeAfter + applied.product;
        if (total > 0) {
          console.log(`[deploy] merged client media: ${applied.portfolio} photos, ${applied.beforeAfter} pairs, ${applied.product} products`);
        }
      }

      const { siteUrl, deploymentUrl, slug } = await publishBlueprint(
        projectName || currentSnapshot.profile?.name, snapshot
      );

      // Record what actually went live, so a later client photo upload can
      // republish THIS and not whatever happens to be sitting in `blueprint`.
      // Stored pre-merge: client media is re-merged fresh on every publish, and
      // storing the merged copy would bake one moment's photos in permanently.
      if (projectId) {
        const { error } = await getSupabaseAdmin()
          .from('projects')
          .update({ published_blueprint: currentSnapshot, published_at: new Date().toISOString() })
          .eq('id', String(projectId));
        // Not fatal — the site is already live. Loud, because until this lands
        // the auto-redeploy will decline to run and her uploads will not appear.
        if (error) console.error('[deploy] could not record the published blueprint:', error.message);

        // And append it to the history, so this deploy is recoverable after the
        // next one overwrites published_blueprint. Best effort by design: the
        // site is already live, and refusing to finish a successful deploy
        // because the audit trail failed would be the wrong trade.
        await recordBlueprintVersion(
          String(projectId),
          (req as AuthedRequest).user?.id,
          currentSnapshot,
          `Deployed ${projectName || currentSnapshot.profile?.name || ''}`.trim()
        );
      } else {
        console.warn('[deploy] no projectId supplied — client uploads will not auto-publish for this site.');
      }

      res.json({ success: true, url: siteUrl, deploymentUrl, projectName: slug });
    } catch (error: any) {
      console.error('Deploy error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Reads the blueprint back off a live site.
   *
   * Every deployed page carries the exact blueprint it was built from, injected
   * as window.__TXSONS_BLUEPRINT__. That makes the live site the most reliable
   * record of what a client actually has — more reliable than projects.blueprint,
   * which is only as fresh as the last Studio deploy.
   *
   * Written for the 2026-08-31 incident: a client photo upload republished a
   * stale blueprint over a live salon site, and the fix was a Cloudflare
   * rollback. The rollback restores the page, but the operator's own database
   * still holds the bad version, and nothing existed to close that gap.
   *
   * Uses safeFetchText, so a hand-typed URL cannot be pointed at the metadata
   * endpoint or anything on the private network.
   */
  app.post("/api/restore-from-live", async (req, res) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'A live site URL is required.' });
      }

      const { text: html } = await safeFetchText(url, { timeoutMs: 15_000 });

      // Deliberately anchored on the exact injection this server writes. A
      // looser search would happily pull a blueprint out of any page that
      // happened to mention one.
      const match = html.match(/window\.__TXSONS_BLUEPRINT__\s*=\s*(\{[\s\S]*?\});?\s*(?:window\.__TXSONS_API__|<\/script>)/);
      if (!match) {
        return res.status(422).json({
          success: false,
          error: 'No blueprint found on that page. Check the URL points at a site deployed from here.',
        });
      }

      let blueprint: any;
      try {
        blueprint = JSON.parse(match[1]);
      } catch {
        return res.status(422).json({ success: false, error: 'The blueprint on that page could not be read.' });
      }
      if (!blueprint?.profile?.name) {
        return res.status(422).json({ success: false, error: 'That page carries a blueprint with no business profile.' });
      }

      res.json({ success: true, blueprint });
    } catch (error: any) {
      console.error('[restore] failed:', error?.message || error);
      res.status(500).json({ success: false, error: error?.message || 'Could not read that site.' });
    }
  });

  // Attach Custom Domain (e.g. from Namecheap) to Cloudflare Pages Project
  app.post("/api/domains/add", async (req, res) => {
    try {
      const { projectName, domainName } = req.body;
      if (!projectName || !domainName) {
        return res.status(400).json({ success: false, error: "projectName and domainName are required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName);
      const cleanDomain = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      const domainResult = await addPagesDomain(accountId, apiToken, slug, cleanDomain);

      res.json({
        success: true,
        domain: domainResult,
        domainName: cleanDomain,
        targetCname: `${slug}.pages.dev`,
        dnsInstructions: {
          type: 'CNAME',
          host: cleanDomain.startsWith('www.') ? 'www' : '@',
          target: `${slug}.pages.dev`,
          ttl: 'Automatic',
          note: 'Add this CNAME record in your domain registrar (e.g. Namecheap Advanced DNS) to point to Cloudflare Pages.'
        }
      });
    } catch (error: any) {
      console.error('Add domain error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // List Custom Domains attached to a project
  app.get("/api/domains/list", async (req, res) => {
    try {
      const projectName = req.query.project as string;
      if (!projectName) {
        return res.status(400).json({ success: false, error: "project query parameter is required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName);
      const domains = await listPagesDomains(accountId, apiToken, slug);

      res.json({
        success: true,
        projectName: slug,
        domains: domains.map((d: any) => ({
          id: d.id,
          name: d.name,
          status: d.status,
          verification_data: d.verification_data,
          ssl: d.ssl,
          certificate_authority: d.certificate_authority,
          created_on: d.created_on
        }))
      });
    } catch (error: any) {
      console.error('List domains error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Verify DNS and SSL status for a custom domain
  app.get("/api/domains/verify", async (req, res) => {
    try {
      const projectName = req.query.project as string;
      const domainName = req.query.domain as string;
      if (!projectName || !domainName) {
        return res.status(400).json({ success: false, error: "project and domain query parameters are required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName);
      const cleanDomain = domainName.trim().toLowerCase();

      const status = await getPagesDomainStatus(accountId, apiToken, slug, cleanDomain);

      res.json({
        success: true,
        domain: status,
        isLive: status?.status === 'active' || status?.status === 'ready'
      });
    } catch (error: any) {
      console.error('Verify domain error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Remove a Custom Domain
  app.delete("/api/domains/remove", async (req, res) => {
    try {
      const projectName = req.query.project as string || req.body?.projectName;
      const domainName = req.query.domain as string || req.body?.domainName;
      if (!projectName || !domainName) {
        return res.status(400).json({ success: false, error: "project and domain are required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName);
      const cleanDomain = domainName.trim().toLowerCase();

      await deletePagesDomain(accountId, apiToken, slug, cleanDomain);

      res.json({ success: true, removed: cleanDomain });
    } catch (error: any) {
      console.error('Remove domain error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get Deployment History for a Project
  /**
   * The versions of one project's site, newest first.
   *
   * Metadata only. The blueprints themselves are large and listing thirty of
   * them would send megabytes to render a list of dates.
   */
  app.get("/api/projects/:projectId/versions", async (req: AuthedRequest, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('blueprint_versions')
        .select('id, label, created_at')
        .eq('project_id', String(req.params.projectId))
        .eq('owner_id', req.user!.id)
        .order('created_at', { ascending: false })
        .limit(BLUEPRINT_VERSION_CAP);

      if (error) throw new Error(error.message);

      // When the site was last published, from the project row rather than from
      // the newest version. They agree from now on, but every site deployed
      // before this table existed has a published_at and no versions at all,
      // and reporting "never published" for a live site would be a lie.
      const { data: proj } = await getSupabaseAdmin()
        .from('projects')
        .select('published_at')
        .eq('id', String(req.params.projectId))
        .maybeSingle();

      res.json({ success: true, versions: data || [], publishedAt: proj?.published_at || null });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Could not read the version history.' });
    }
  });

  /**
   * Returns one version's full blueprint, so the Studio can load it.
   *
   * Deliberately does NOT deploy. Restoring is loading the old version into the
   * editor, where the operator can look at it and decide; a restore that
   * published immediately would be a second irreversible action offered as the
   * remedy for the first.
   */
  app.get("/api/projects/:projectId/versions/:versionId", async (req: AuthedRequest, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('blueprint_versions')
        .select('id, label, created_at, blueprint')
        .eq('id', String(req.params.versionId))
        .eq('project_id', String(req.params.projectId))
        .eq('owner_id', req.user!.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return res.status(404).json({ success: false, error: 'No such version.' });
      res.json({ success: true, version: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Could not read that version.' });
    }
  });

  app.get("/api/deployments/history", async (req, res) => {
    try {
      const projectName = req.query.project as string;
      if (!projectName) {
        return res.status(400).json({ success: false, error: "project query parameter is required" });
      }

      const { accountId, apiToken } = getCloudflareCredentials();
      const slug = sanitizeProjectName(projectName);
      const deployments = await listPagesDeployments(accountId, apiToken, slug);

      res.json({
        success: true,
        projectName: slug,
        deployments: deployments.slice(0, 10).map((dep: any) => ({
          id: dep.id,
          url: dep.url,
          environment: dep.environment,
          created_on: dep.created_on,
          latest_stage: dep.latest_stage,
          aliases: dep.aliases,
          is_current: dep.is_current
        }))
      });
    } catch (error: any) {
      console.error('Deployment history error:', error);
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

      const response = await callModel({ task: 'draft-outreach', prompt });

      res.json({ success: true, proposal: response.text });
    } catch (error: any) {
      console.error("AI Proposal Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Scrape Existing Website Route
  app.post("/api/scrape-site", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: "URL is required" });
      }

      console.log(`[Scraper] Fetching URL: ${url}`);

      // safeFetchText enforces http(s)-only, blocks private/reserved addresses on
      // every redirect hop, and caps both time and response size. Do not swap this
      // back for a bare fetch() — the URL comes straight from the client.
      const { text: htmlText, finalUrl } = await safeFetchText(url);
      if (finalUrl !== url) console.log(`[Scraper] Resolved to: ${finalUrl}`);

      // Simple HTML cleanup to save tokens: remove script and style tags, then remove all tags, then collapse whitespace
      const cleanHtml = htmlText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .substring(0, 30000); // cap at ~10k tokens

      const prompt = `You are an expert data extraction AI. Read the following website text and extract a JSON dossier for a web agency client intake.
      
      Website Text:
      ${cleanHtml}
      
      Extract as much of the following as possible. Return ONLY valid JSON, nothing else. No markdown formatting blocks.
      {
        "businessName": "Name of business",
        "email": "Contact email if found",
        "phone": "Phone number if found",
        "address": "Address if found",
        "hours": "Operating hours if found",
        "tagline": "A short marketing tagline for them",
        "description": "A 1-2 sentence description of what they do",
        "category": "One of: 'Food & Beverage', 'Beauty & Wellness', 'Home & Trade Services', 'Professional & Medical', 'Campaign & Leadership'",
        "services": [
           { "id": "s1", "name": "Service name", "description": "Short description", "price": "Price if found" }
        ]
      }`;
      
      // Through the router, not a direct client call. The previous code called
      // `ai.generateContent(prompt)` and read `result.response.text()` — the
      // shape of the older @google/generative-ai package. On the installed
      // @google/genai the method lives at `client.models.generateContent`, so
      // this route threw "ai.generateContent is not a function" on every request
      // and had never worked since it was added.
      //
      // Routing it means it also gets the retry logic, and becomes swappable to
      // a cheaper model with MODEL_SCRAPE_EXTRACT — this is pure extraction, the
      // best candidate in the app for that.
      const result = await callModel({ task: 'scrape-extract', prompt });
      const parsed = parseModelJson(result);

      console.log(`[scrape] extracted via ${result.model} (${result.promptTokens ?? '?'} in / ${result.completionTokens ?? '?'} out)`);
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("Scraping Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Multimodal AI Photo / Menu / Flyer Extraction Route
  /**
   * Reads a service menu out of a screenshot.
   *
   * Retyping nine services with prices and durations off a Square booking page
   * is the kind of work that gets done badly at 11pm, and a mistyped price is a
   * number a customer acts on. A screenshot is what the operator already has.
   *
   * Booking links are deliberately NOT guessed from the image. A URL cannot be
   * read off a screenshot, and inventing one produces a booking page that will
   * not load — a failure nobody notices until a customer gives up. Those stay
   * hand-pasted from Square's own dashboard.
   */
  app.post("/api/extract-services", async (req, res) => {
    try {
      const { images } = req.body || {};
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, error: "At least one image is required" });
      }

      const parts: any[] = [];
      for (const img of images.slice(0, 4)) {
        if (!img?.data) continue;
        const cleanBase64 = img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data;
        parts.push({ inlineData: { data: cleanBase64, mimeType: img.mimeType || 'image/jpeg' } });
      }
      if (parts.length === 0) {
        return res.status(400).json({ success: false, error: "No readable image data was supplied." });
      }

      parts.push({
        text: [
          'Read the service menu in these images and return the services exactly as printed.',
          '',
          'Return ONLY a JSON array, no markdown fences and no commentary:',
          '[{ "title": "", "price": "", "duration": "", "description": "" }]',
          '',
          'Rules:',
          '- Copy prices and durations VERBATIM, including symbols and qualifiers:',
          '  "$350+", "From $220", "Custom", "Enquire", "90 min", "1 hr 30 min".',
          '- Do not convert, round, normalise or tidy a price or a duration. These',
          '  are numbers a customer will act on and a guess is worse than a blank.',
          '- Leave a field as an empty string when the image does not show it.',
          '  Never infer a plausible price for a service that does not list one.',
          '- description: only text actually shown for that service. Do not write',
          '  marketing copy.',
          '- Ignore navigation, headings, staff names, reviews and totals.',
        ].join(String.fromCharCode(10)),
      });

      const response = await callModel({ task: 'extract-services', parts });
      const parsed = parseModelJson<any>(response);
      const rows = Array.isArray(parsed) ? parsed : (parsed?.services || []);

      const services = rows
        .filter((r: any) => r && typeof r.title === 'string' && r.title.trim())
        .slice(0, 40)
        .map((r: any) => ({
          title: String(r.title).trim(),
          price: typeof r.price === 'string' ? r.price.trim() : '',
          duration: typeof r.duration === 'string' ? r.duration.trim() : '',
          description: typeof r.description === 'string' ? r.description.trim() : '',
        }));

      res.json({ success: true, services });
    } catch (error: any) {
      console.error('[extract-services] failed:', error?.message || error);
      res.status(500).json({ success: false, error: error?.message || 'Could not read that image.' });
    }
  });

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

      // parts carry images, so callModel forces Gemini regardless of config —
      // a text model would silently ignore the photos and invent a dossier.
      const response = await callModel({ task: 'extract-dossier', parts });

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
   - If user asks for dark background or theme change, update 'theme' and 'profile.theme'. Valid values: 'campaign-navy', 'campaign-judicial', 'crimson-bold', 'emerald-gold', 'luxury', 'dark', 'light', 'custom'.
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

      const response = await callModel({ task: 'studio-edit', prompt: systemInstruction });

      // Only what the model actually returned is applied. It is asked for the
      // complete object and does not reliably give one; a field it omits is a
      // field it did not change, not a field to delete. See lib/snapshotMerge.
      const updatedSnapshot = mergeSnapshotEdit(currentSnapshot, parseModelJson(response));

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
  // -------------------------------------------------------------------------
  // Client intake portal
  //
  // Replaces the copy-paste "reply to this email with your logo and photos"
  // flow. The client opens /intake/<token> and fills it in themselves.
  //
  // The two /api/intake/:token routes are PUBLIC by design — clients have no
  // account. They are guarded by the token being unguessable and revocable, and
  // they read/write through the service-role client, so `anon` needs no database
  // policies at all.
  //
  // TODO: rate-limit these, same as /api/lead. A known token is currently
  // submittable an unlimited number of times.
  // -------------------------------------------------------------------------

  const MAX_SUBMISSION_BYTES = 8 * 1024 * 1024; // generous for a few photos

  /** Looks up a live intake by share token. Null when missing or revoked. */
  async function findIntakeByToken(token: string) {
    const safeToken = String(token || '').trim();
    // Tokens are hex from randomBytes; reject anything else before querying.
    if (!/^[a-f0-9]{32,64}$/i.test(safeToken)) return null;

    const { data, error } = await getSupabaseAdmin()
      .from('client_intakes')
      .select('id, business_name, client_contact, category, share_token_revoked')
      .eq('share_token', safeToken)
      .maybeSingle();

    if (error) {
      console.error('[intake] Token lookup failed:', error);
      return null;
    }
    if (!data || data.share_token_revoked) return null;
    return data;
  }

  // Public: what the portal page needs to render. Deliberately returns only the
  // business name and contact — never the full dossier, pricing, or notes.
  app.get("/api/intake/:token", async (req, res) => {
    try {
      const intake = await findIntakeByToken(req.params.token);
      if (!intake) {
        return res.status(404).json({ success: false, error: "This link is no longer active. Please ask for a new one." });
      }
      res.json({
        success: true,
        businessName: intake.business_name,
        contactName: intake.client_contact,
        category: intake.category,
      });
    } catch (error: any) {
      console.error('[intake] Lookup error:', error);
      res.status(500).json({ success: false, error: "Could not load this form." });
    }
  });

  // Public: accept a client's submission.
  app.post("/api/intake/:token", async (req, res) => {
    try {
      const intake = await findIntakeByToken(req.params.token);
      if (!intake) {
        return res.status(404).json({ success: false, error: "This link is no longer active. Please ask for a new one." });
      }

      const payload = req.body?.payload;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: "Nothing was submitted." });
      }

      const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      if (size > MAX_SUBMISSION_BYTES) {
        return res.status(413).json({
          success: false,
          error: `That's too large to submit (${Math.round(size / 1024 / 1024)}MB). Please send fewer or smaller photos.`,
        });
      }

      // Stored as a new row rather than merged into the intake: a public form
      // must never overwrite a curated client record. Morgan reviews and merges.
      const { error } = await getSupabaseAdmin().from('intake_submissions').insert({
        intake_id: intake.id,
        payload,
      });
      if (error) throw error;

      console.log(`[intake] Submission received for "${intake.business_name}" (${Math.round(size / 1024)}KB)`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[intake] Submission error:', error);
      res.status(500).json({ success: false, error: "Could not save your submission. Please try again." });
    }
  });

  // Admin: mint (or rotate) a share link for a client.
  app.post("/api/intake-link", async (req, res) => {
    try {
      const { intakeId, revoke } = req.body || {};
      if (!intakeId) return res.status(400).json({ success: false, error: "intakeId is required" });

      if (revoke) {
        const { error } = await getSupabaseAdmin()
          .from('client_intakes')
          .update({ share_token_revoked: true })
          .eq('id', intakeId);
        if (error) throw error;
        return res.json({ success: true, revoked: true });
      }

      const token = crypto.randomBytes(24).toString('hex');
      const { error } = await getSupabaseAdmin()
        .from('client_intakes')
        .update({ share_token: token, share_token_revoked: false })
        .eq('id', intakeId);
      if (error) throw error;

      const base = process.env.APP_URL?.replace(/\/+$/, '') || `http://localhost:${PORT}`;
      res.json({ success: true, token, url: `${base}/intake/${token}` });
    } catch (error: any) {
      console.error('[intake] Link generation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // Business assistant
  //
  // A real conversation, unlike /api/studio-chat which is a one-shot JSON
  // transformer for blueprints. Grounded in the operating-manual files under
  // context/ and references/, plus a summary of the event log, so it can answer
  // "what should I focus on" with actual numbers rather than generic advice.
  //
  // A model knows nothing about this business on its own — everything it can
  // reason about has to be in the prompt. That is what these files are for.
  // -------------------------------------------------------------------------

  const CONTEXT_FILES = [
    'context/about-business.md',
    'context/priorities.md',
    'context/about-me.md',
    'references/voice.md',
    'connections.md',
  ];

  let cachedContext: string | null = null;
  async function loadBusinessContext(): Promise<string> {
    if (cachedContext !== null) return cachedContext;
    const parts: string[] = [];
    for (const rel of CONTEXT_FILES) {
      try {
        const text = await fs.readFile(safeResolvePath(process.cwd(), ...rel.split('/')), 'utf8');
        parts.push(`--- ${rel} ---
${text.trim()}`);
      } catch {
        // A missing context file is not an error — the operator may not have
        // written it yet. The assistant just knows less.
      }
    }
    cachedContext = parts.join('\n\n');
    return cachedContext;
  }

  /**
   * Where each client actually stands, for the assistant.
   *
   * It could talk about the business in general and knew nothing about any
   * particular client, so "what should I work on" produced advice rather than
   * answers. Everything needed was already computed for the Clients tab and
   * simply never reached the model.
   *
   * Read fresh per request rather than cached. The whole value is that it is
   * current, and a stale answer about which client has unpublished edits is
   * worse than no answer at all.
   */
  async function loadClientContext(ownerId?: string): Promise<string> {
    if (!ownerId) return '';
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('projects')
        .select('company_name, status, engagement, published_at, updated_at, blueprint')
        .eq('owner_id', ownerId)
        .order('updated_at', { ascending: false })
        .limit(40);
      if (error || !data?.length) return '';

      const lines = data.map((row: any) => {
        const state = stageOf({
          project: {
            engagement: row.engagement === 'commissioned' ? 'commissioned' : 'demo',
            publishedAt: row.published_at || undefined,
            updatedAt: row.updated_at,
            blueprint: row.blueprint,
          },
        });
        const bits = [
          '- ' + (row.company_name || 'Untitled'),
          'stage: ' + state.stage,
          'publish: ' + state.publish,
          'status: ' + (row.status || 'unknown'),
        ];
        if (state.issues.length) {
          bits.push(state.issues.length + ' issue(s): ' + state.issues.map(i => i.field).join(', '));
        }
        if (state.hasClaimIssues) bits.push('SAYS UNVERIFIED THINGS ABOUT THE BUSINESS');
        return bits.join(' - ');
      });

      return [
        '## His clients right now',
        'Computed from the database on this request.',
        'publish=stale means he has edited since publishing, so customers see an older site.',
        'publish=never means nothing has been published through the recording path, and that',
        "client's own photo uploads will not go live until he publishes once.",
        '',
      ].concat(lines).join(String.fromCharCode(10));
    } catch (error: any) {
      // The assistant should know less, never fail.
      console.warn('[assistant] client context unavailable:', error?.message || error);
      return '';
    }
  }

  app.get("/api/assistant/models", (_req, res) => {
    res.json({
      success: true,
      choices: ASSISTANT_MODEL_CHOICES,
      // What a request with no explicit choice would use.
      default: `${resolveModel('assistant').provider}:${resolveModel('assistant').model}`,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    });
  });

  app.post("/api/assistant", async (req, res) => {
    try {
      const { messages, stats, model: requestedModel } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: "messages array is required" });
      }

      // Keep the window bounded; long chats otherwise grow cost without bound.
      const trimmed: ChatMessage[] = messages
        .slice(-20)
        .filter((m: any) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
        .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 8000) }));

      const businessContext = await loadBusinessContext();
      const clientContext = await loadClientContext((req as AuthedRequest).user?.id);

      // Vault retrieval keys off the latest question only. Scoring the whole
      // conversation drags in terms from three topics ago and reliably retrieves
      // notes about what he was asking before, not what he is asking now.
      const lastUserMessage = [...trimmed].reverse().find(m => m.role === 'user')?.content || '';
      const vaultContext = await vaultContextFor(lastUserMessage);

      const system = [
        'You are the operating assistant for Texas Sons, a one-person web agency run by Morgan Valdez.',
        'You help him decide what to work on, review how the business is going, and think through his website-building pipeline.',
        '',
        'Rules:',
        '- Be direct and specific. He is technical and busy. No filler, no motivational padding.',
        '- Ground every claim about his business in the numbers provided below. If the data does not support an answer, say what is missing rather than guessing.',
        '- If the pipeline stats are empty or thin, say so plainly instead of inventing trends.',
        '- When you recommend something, say what it would cost him in time and what it would change.',
        '',
        businessContext ? `## His operating manual\n${businessContext}` : '',
        clientContext,
        vaultContext,
        stats
          ? `## Current pipeline (from his event log)\n${JSON.stringify(stats, null, 2)}`
          : '## Current pipeline\nNo event data supplied.',
      ].filter(Boolean).join('\n');

      // An unrecognised choice falls back to the configured default rather than
      // erroring — a stale value from an old browser tab should not break chat.
      const modelSpec = isAllowedAssistantModel(requestedModel) ? requestedModel : undefined;
      if (requestedModel && !modelSpec) {
        console.warn(`[assistant] Ignoring unrecognised model "${requestedModel}".`);
      }

      const config = modelSpec ? { why: 'Chosen in the chat panel' } : resolveModel('assistant');
      const result = await callModel({ task: 'assistant', messages: trimmed, system, modelSpec });

      res.json({
        success: true,
        reply: result.text,
        model: result.model,
        provider: result.provider,
        usage: {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          reasoningTokens: result.reasoningTokens,
          // Real cost from OpenRouter, not an estimate off a price table.
          costUsd: result.costUsd,
        },
        configuredBy: config.why,
      });
    } catch (error: any) {
      console.error('[assistant] error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // Client content portal
  //
  // The client manages their own portfolio, transformations and product shelf.
  // Their media lives in client_media, never on the blueprint, so the Studio
  // cannot overwrite their work and they cannot overwrite the operator's design.
  //
  // Saving triggers a redeploy rather than the site fetching content at runtime.
  // A deployed site stays static on Cloudflare's edge: fast, indexable, and still
  // up if this server is down. Runtime fetch would have made every client site
  // depend on this process staying alive.
  //
  // Public by design — clients have no account. Guarded by an unguessable,
  // revocable token and served through the service-role client, so `anon` needs
  // no database policy at all.
  // -------------------------------------------------------------------------

  const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

  async function findProjectByPortalToken(token: string) {
    const safe = String(token || '').trim();
    if (!/^[a-f0-9]{32,64}$/i.test(safe)) return null;

    const { data, error } = await getSupabaseAdmin()
      .from('projects')
      .select('id, owner_id, company_name, portal_token_revoked')
      .eq('portal_token', safe)
      .maybeSingle();

    if (error) {
      console.error('[portal] token lookup failed:', error.message);
      return null;
    }
    if (!data || data.portal_token_revoked) return null;
    return data;
  }

  // Debounced per project: a client uploading eight photos should produce one
  // deploy, not eight. Cloudflare has deploy rate limits worth respecting.
  const pendingDeploys = new Map<string, ReturnType<typeof setTimeout>>();
  const REDEPLOY_DEBOUNCE_MS = 20_000;

  function scheduleRedeploy(projectId: string, siteName: string) {
    const existing = pendingDeploys.get(projectId);
    if (existing) clearTimeout(existing);

    pendingDeploys.set(projectId, setTimeout(async () => {
      pendingDeploys.delete(projectId);
      try {
        const db = getSupabaseAdmin();
        const { data: proj } = await db
          .from('projects')
          .select('blueprint, published_blueprint')
          .eq('id', projectId)
          .maybeSingle();

        // Republish what is LIVE, never what was last saved.
        //
        // This used to read `blueprint`, which is written only when the operator
        // deploys from the Studio. Any tuning not followed by a deploy never
        // reached it, so an unattended redeploy could push a materially older
        // site over a newer one. On 2026-08-31 a client uploaded a photo and her
        // live site reverted — different colours, weeks of work gone — because a
        // photo upload was trusted to republish a blueprint nobody had reviewed.
        //
        // If nothing has been published through this path yet, refuse. A photo
        // upload changing the photos is the whole contract; a photo upload
        // rewriting the site is a bug, and guessing is what caused it.
        if (!proj?.published_blueprint) {
          console.warn(
            '[portal] redeploy skipped for ' + projectId + ': nothing recorded as published. ' +
            'Publish once from the app and client uploads will go live automatically after that.'
          );
          return;
        }

        const { blueprint } = await blueprintWithClientMedia(db, projectId, proj.published_blueprint);
        await publishBlueprint(siteName || blueprint?.profile?.name, blueprint);
        console.log('[portal] redeployed after a content change: ' + projectId);
      } catch (err: any) {
        // A failed redeploy must not lose her upload. The media is already
        // saved; the next save or a manual deploy will publish it.
        console.error('[portal] redeploy failed for ' + projectId + ':', err.message);
      }
    }, REDEPLOY_DEBOUNCE_MS));
  }

  // Public: what the portal page needs. Returns the client's own media and their
  // business name only — never the blueprint, pricing, or operator notes.
  app.get("/api/portal/:token", async (req, res) => {
    try {
      const project = await findProjectByPortalToken(req.params.token);
      if (!project) {
        return res.status(404).json({ success: false, error: "This link is no longer active. Please ask for a new one." });
      }

      const { data: media } = await getSupabaseAdmin()
        .from('client_media')
        .select('id, kind, data, sort_order')
        .eq('project_id', project.id)
        .eq('hidden', false)
        .order('sort_order', { ascending: true });

      res.json({ success: true, businessName: project.company_name, media: media || [] });
    } catch (error: any) {
      console.error('[portal] read error:', error);
      res.status(500).json({ success: false, error: "Could not load your content." });
    }
  });

  app.post("/api/portal/:token/media", async (req, res) => {
    try {
      const project = await findProjectByPortalToken(req.params.token);
      if (!project) {
        return res.status(404).json({ success: false, error: "This link is no longer active." });
      }

      const { kind, data } = req.body || {};
      const kinds: MediaKind[] = ['portfolio', 'beforeAfter', 'product'];
      if (!kinds.includes(kind)) {
        return res.status(400).json({ success: false, error: "kind must be one of: " + kinds.join(', ') });
      }
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, error: "Nothing was submitted." });
      }

      const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
      if (size > MAX_MEDIA_BYTES) {
        return res.status(413).json({
          success: false,
          error: "That is too large (" + Math.round(size / 1024 / 1024) + "MB). Please use a smaller image.",
        });
      }

      const { data: inserted, error } = await getSupabaseAdmin()
        .from('client_media')
        .insert({
          project_id: project.id,
          owner_id: project.owner_id,
          kind,
          data,
          sort_order: Number(req.body.sortOrder) || 0,
        })
        .select('id')
        .single();
      if (error) throw error;

      scheduleRedeploy(project.id, project.company_name);
      res.json({ success: true, id: inserted?.id, publishing: true });
    } catch (error: any) {
      console.error('[portal] save error:', error);
      res.status(500).json({ success: false, error: "Could not save. Please try again." });
    }
  });

  // Soft delete: hidden rather than removed, so a mis-tap is recoverable and the
  // operator keeps a record of what was published when.
  app.delete("/api/portal/:token/media/:id", async (req, res) => {
    try {
      const project = await findProjectByPortalToken(req.params.token);
      if (!project) {
        return res.status(404).json({ success: false, error: "This link is no longer active." });
      }

      const { error } = await getSupabaseAdmin()
        .from('client_media')
        .update({ hidden: true })
        .eq('id', req.params.id)
        .eq('project_id', project.id);
      if (error) throw error;

      scheduleRedeploy(project.id, project.company_name);
      res.json({ success: true, publishing: true });
    } catch (error: any) {
      console.error('[portal] delete error:', error);
      res.status(500).json({ success: false, error: "Could not remove that item." });
    }
  });

  // -------------------------------------------------------------------------
  // Signed-in client dashboard
  //
  // The same content as the token portal, reached by a Google sign-in instead of
  // an unguessable link. Both exist on purpose: the link needs nothing of the
  // client and works the minute it is sent, while accounts are the only way to
  // give a stylist access and take it away again without disturbing anyone else.
  //
  // Every route names its project and mounts requireClientMember, which resolves
  // membership for that project specifically. There is no ambient "current
  // client" — a session valid for one salon is not a session for another.
  // -------------------------------------------------------------------------

  const clientGate = requireClientMember(() => getSupabaseAdmin());

  /** Which projects this signed-in person can manage. Drives the dashboard. */
  app.get("/api/client/projects", requireClientSession, async (req: ClientRequest, res) => {
    // requireClientSession, not clientGate: there is no single project yet —
    // finding out which ones exist is the whole point of the route. So it must
    // filter by the session's own email and return nothing else.
    try {
      const user = req.user!;
      const db = getSupabaseAdmin();
      const [{ data: owned }, { data: memberships }] = await Promise.all([
        db.from('projects').select('id, company_name').eq('owner_id', user.id),
        db.from('client_users').select('project_id, role').ilike('email', user.email),
      ]);

      const ids = (memberships || []).map(m => m.project_id);
      const { data: joined } = ids.length
        ? await db.from('projects').select('id, company_name').in('id', ids)
        : { data: [] as any[] };

      const byId = new Map<string, any>();
      for (const p of owned || []) byId.set(p.id, { id: p.id, name: p.company_name, role: 'owner' });
      for (const p of joined || []) {
        if (byId.has(p.id)) continue;
        const role = (memberships || []).find(m => m.project_id === p.id)?.role || 'member';
        byId.set(p.id, { id: p.id, name: p.company_name, role });
      }

      res.json({ success: true, email: user.email, projects: [...byId.values()] });
    } catch (error: any) {
      console.error('[client] project list failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not load your salons.' });
    }
  });

  /** Read-only view of what is currently published, so she can spot what is wrong. */
  app.get("/api/client/:projectId/site", clientGate, async (req: ClientRequest, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('projects')
        .select('company_name, domain, blueprint')
        .eq('id', req.params.projectId)
        .maybeSingle();
      if (error) throw error;

      const bp = (data?.blueprint || {}) as any;
      const p = bp.profile || {};
      // Her own business details and nothing else. The blueprint also carries
      // operator notes, tier and pricing for the build itself, none of which is
      // hers to see.
      res.json({
        success: true,
        site: {
          name: data?.company_name,
          domain: data?.domain,
          phone: p.phone,
          email: p.email,
          address: p.address,
          hours: p.hours,
          tagline: p.tagline,
          bookingUrl: p.bookingUrl,
          services: Array.isArray(bp.services) ? bp.services : [],
        },
      });
    } catch (error: any) {
      console.error('[client] site read failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not load your site details.' });
    }
  });

  app.get("/api/client/:projectId/media", clientGate, async (req: ClientRequest, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('client_media')
        .select('id, kind, data, sort_order')
        .eq('project_id', req.params.projectId)
        .eq('hidden', false)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      res.json({ success: true, media: data || [], role: req.membership?.role });
    } catch (error: any) {
      console.error('[client] media read failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not load your photos.' });
    }
  });

  app.post("/api/client/:projectId/media", clientGate, async (req: ClientRequest, res) => {
    try {
      const projectId = req.params.projectId;
      const { kind, data } = req.body || {};
      const kinds: MediaKind[] = ['portfolio', 'beforeAfter', 'product'];
      if (!kinds.includes(kind)) {
        return res.status(400).json({ success: false, error: "kind must be one of: " + kinds.join(', ') });
      }
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, error: "Nothing was submitted." });
      }

      const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
      if (size > MAX_MEDIA_BYTES) {
        return res.status(413).json({
          success: false,
          error: "That is too large (" + Math.round(size / 1024 / 1024) + "MB). Please use a smaller image.",
        });
      }

      const { data: project } = await getSupabaseAdmin()
        .from('projects').select('owner_id, company_name').eq('id', projectId).maybeSingle();

      const { data: inserted, error } = await getSupabaseAdmin()
        .from('client_media')
        .insert({
          project_id: projectId,
          owner_id: project?.owner_id,
          kind,
          data,
          sort_order: Number(req.body.sortOrder) || 0,
        })
        .select('id')
        .single();
      if (error) throw error;

      scheduleRedeploy(projectId, project?.company_name || projectId);
      res.json({ success: true, id: inserted?.id, publishing: true });
    } catch (error: any) {
      console.error('[client] media save failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not save. Please try again.' });
    }
  });

  /**
   * Sets the order of a project's photos.
   *
   * `sort_order` has been on the table and in the read query since client_media
   * shipped, and nothing ever wrote it — every row inserted at 0, so the
   * gallery came out in whatever order Postgres felt like. Which photo leads a
   * salon's portfolio is a decision, and it was being made by chance.
   *
   * Deliberately does NOT redeploy, unlike the upload and delete routes above.
   * Those are the client acting on her own site and publish themselves; this is
   * the operator arranging a page in the Studio, and an operator's edits never
   * publish without them pressing Deploy. That distinction is the whole reason
   * published_blueprint exists.
   */
  app.patch("/api/client/:projectId/media/order", clientGate, async (req: ClientRequest, res) => {
    try {
      const projectId = req.params.projectId;
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
      if (!ids || !ids.length) {
        return res.status(400).json({ success: false, error: "ids must be a non-empty array." });
      }

      // Scoped by project as well as by id, so an id from another salon cannot
      // be reordered just because this session is valid somewhere — the same
      // reason the delete route above filters on both.
      const db = getSupabaseAdmin();
      const results = await Promise.all(
        ids.map((id, index) =>
          db.from('client_media').update({ sort_order: index }).eq('id', id).eq('project_id', projectId)
        )
      );
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;

      res.json({ success: true, ordered: ids.length });
    } catch (error: any) {
      console.error('[client] media reorder failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not save that order.' });
    }
  });

  app.delete("/api/client/:projectId/media/:id", clientGate, async (req: ClientRequest, res) => {
    try {
      const projectId = req.params.projectId;
      // Scoped by project as well as by id: an id from another salon must not
      // be deletable just because this session is valid somewhere.
      const { error } = await getSupabaseAdmin()
        .from('client_media')
        .update({ hidden: true })
        .eq('id', req.params.id)
        .eq('project_id', projectId);
      if (error) throw error;

      const { data: project } = await getSupabaseAdmin()
        .from('projects').select('company_name').eq('id', projectId).maybeSingle();
      scheduleRedeploy(projectId, project?.company_name || projectId);
      res.json({ success: true, publishing: true });
    } catch (error: any) {
      console.error('[client] media delete failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not remove that item.' });
    }
  });

  // --- Who else has access -------------------------------------------------

  app.get("/api/client/:projectId/access", clientGate, requireClientOwner, async (req: ClientRequest, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('client_users')
        .select('id, email, role, created_at, last_seen_at')
        .eq('project_id', req.params.projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      res.json({ success: true, people: data || [], you: req.membership?.email });
    } catch (error: any) {
      console.error('[client] access read failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not load the list.' });
    }
  });

  app.post("/api/client/:projectId/access", clientGate, requireClientOwner, async (req: ClientRequest, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const role = req.body?.role === 'owner' ? 'owner' : 'member';
      // Deliberately loose: this is a typo guard, not validation. Whether the
      // address exists is decided when someone signs in with it, not here.
      if (!email || !email.includes('@') || email.length > 254) {
        return res.status(400).json({ success: false, error: 'That does not look like an email address.' });
      }

      const { error } = await getSupabaseAdmin()
        .from('client_users')
        .upsert(
          { project_id: req.params.projectId, email, role, invited_by: req.user?.id },
          { onConflict: 'project_id,email' }
        );
      if (error) throw error;

      // No email is sent. Access begins the moment they sign in with Google
      // using this address — there is no invitation to accept, no token to
      // expire, and nothing to go stale in an inbox.
      res.json({ success: true, email, role });
    } catch (error: any) {
      console.error('[client] access grant failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not add that person.' });
    }
  });

  app.delete("/api/client/:projectId/access/:id", clientGate, requireClientOwner, async (req: ClientRequest, res) => {
    try {
      const { data: row } = await getSupabaseAdmin()
        .from('client_users')
        .select('email')
        .eq('id', req.params.id)
        .eq('project_id', req.params.projectId)
        .maybeSingle();

      // Locking yourself out is not a thing anyone means to do, and recovering
      // needs the operator. Refuse it.
      if (row && String(row.email).toLowerCase() === req.membership?.email) {
        return res.status(400).json({ success: false, error: 'You cannot remove your own access.' });
      }

      const { error } = await getSupabaseAdmin()
        .from('client_users')
        .delete()
        .eq('id', req.params.id)
        .eq('project_id', req.params.projectId);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('[client] access revoke failed:', error?.message || error);
      res.status(500).json({ success: false, error: 'Could not remove that person.' });
    }
  });

  // Admin: mint or revoke a client's portal link.
  app.post("/api/portal-link", async (req, res) => {
    try {
      const { projectId, revoke } = req.body || {};
      if (!projectId) return res.status(400).json({ success: false, error: "projectId is required" });

      if (revoke) {
        const { error } = await getSupabaseAdmin()
          .from('projects').update({ portal_token_revoked: true }).eq('id', projectId);
        if (error) throw error;
        return res.json({ success: true, revoked: true });
      }

      const token = crypto.randomBytes(24).toString('hex');
      const { error } = await getSupabaseAdmin()
        .from('projects')
        .update({ portal_token: token, portal_token_revoked: false })
        .eq('id', projectId);
      if (error) throw error;

      const base = (process.env.APP_URL || '').replace(/\/+$/, '') || ('http://localhost:' + PORT);
      res.json({ success: true, token, url: base + '/portal/' + token });
    } catch (error: any) {
      console.error('[portal] link error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lead", async (req, res) => {
    try {
      const { businessName, siteSlug, name, phone, email, service, notes, address } = req.body || {};
      if (!name || !phone) {
        return res.status(400).json({ success: false, error: "name and phone are required" });
      }

      // Admin client: this is a trusted server path handling submissions from
      // deployed client sites, which have no session. Using the anon key here
      // made lead capture hostage to whatever RLS policy `leads` happened to
      // have — and it silently broke.
      const supabase = getSupabaseAdmin();
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
    // The true preview loads the built bundle from dist, exactly as the
    // deployed page does. Vite serves source modules and knows nothing about
    // dist, so without this the preview's <script src="/assets/index-HASH.js">
    // 404s in development and the frame comes up blank. HTML is excluded so
    // dist/index.html cannot shadow the app you are working in.
    const builtAssets = express.static(path.join(process.cwd(), 'dist'), { index: false });
    app.use((req, res, next) => {
      if (req.path.endsWith('.html')) return next();
      return builtAssets(req, res, next);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // SPA fallback.
    //
    // This was `app.get('*all', ...)`, which is Express 5 path syntax. On the
    // Express 4 we actually depend on, '*all' is not a wildcard — it matches the
    // single literal path /all. So the fallback never fired: '/' worked only
    // because express.static serves index.html as the directory index, while
    // every client-side route 404'd with a bare "Cannot GET". Both token portals
    // were unreachable in production, and nothing caught it because the smoke
    // suites test pure functions and the dev server uses Vite's own fallback.
    //
    // Written as middleware rather than a wildcard route so it means the same
    // thing in Express 4 and 5, and cannot silently stop matching on upgrade.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      // An unknown /api path must stay a JSON 404. Serving it index.html would
      // hand a fetch() a page of HTML and produce a JSON parse error instead of
      // the actual problem.
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const info = buildInfo();
    console.log(`Server running on http://0.0.0.0:${PORT} — ${info.mode} @ ${info.commit}`);
    // Named at boot rather than discovered later from an incidental log line,
    // which is how OPENROUTER_API_KEY was found missing on Railway.
    logEnvStatus();
  });
}

startServer();