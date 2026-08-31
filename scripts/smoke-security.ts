/**
 * Security smoke tests. Run by `npm test` and enforced in CI.
 *
 * These guard two things that are easy to silently regress:
 *   1. the SSRF blocklist in lib/safeFetch (someone "simplifies" it back to fetch)
 *   2. the admin allowlist parsing in lib/auth
 */

import { isBlockedAddress, safeFetchText } from '../lib/safeFetch';
import { getAdminEmails, isPublicApiPath, isClientApiPath } from '../lib/auth';
import { isAllowedClientOrigin } from '../lib/clientOrigins';
import { resolveModel } from '../lib/models';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function checkRejects(label: string, url: string) {
  try {
    await safeFetchText(url, { timeoutMs: 3000 });
    failures++;
    console.error(`  FAIL  ${label} — fetch was ALLOWED but should have been blocked`);
  } catch {
    // expected
  }
}

// --- SSRF: address classification -----------------------------------------

const mustBlock = [
  '127.0.0.1',        // loopback
  '169.254.169.254',  // AWS/GCP metadata — the classic SSRF target
  '10.0.0.1',         // private
  '172.16.0.1',       // private
  '172.31.255.255',   // private (upper bound)
  '192.168.1.1',      // private
  '0.0.0.0',          // this network
  '100.64.0.1',       // carrier NAT
  '::1',              // IPv6 loopback
  'fd00::1',          // IPv6 unique local
  'fe80::1',          // IPv6 link-local
  '::ffff:127.0.0.1', // IPv4-mapped loopback — the sneaky one
  'not-an-ip',        // unparseable
];

const mustAllow = [
  '8.8.8.8',
  '1.1.1.1',
  '172.32.0.1',       // just outside the 172.16/12 private block
  '172.15.255.255',   // just below it
  '2606:4700::1111',  // public IPv6
];

for (const ip of mustBlock) check(`blocks ${ip}`, isBlockedAddress(ip), true);
for (const ip of mustAllow) check(`allows ${ip}`, isBlockedAddress(ip), false);

// --- SSRF: end-to-end refusal ---------------------------------------------

await checkRejects('rejects localhost URL', 'http://127.0.0.1:3000/');
await checkRejects('rejects metadata endpoint', 'http://169.254.169.254/latest/meta-data/');
await checkRejects('rejects file: protocol', 'file:///etc/passwd');
await checkRejects('rejects private host', 'http://192.168.1.1/admin');

// --- Auth: allowlist parsing ----------------------------------------------

const originalAdmins = process.env.ADMIN_EMAILS;

process.env.ADMIN_EMAILS = '';
check('empty ADMIN_EMAILS falls back to defaults', getAdminEmails().length > 0, true);

process.env.ADMIN_EMAILS = 'A@Example.com, b@example.com ';
check('parses + lowercases + trims', getAdminEmails(), ['a@example.com', 'b@example.com']);

process.env.ADMIN_EMAILS = ' , , ';
check('whitespace-only falls back to defaults', getAdminEmails().length > 0, true);

if (originalAdmins === undefined) delete process.env.ADMIN_EMAILS;
else process.env.ADMIN_EMAILS = originalAdmins;

// --- Auth: which /api paths are public -------------------------------------

// Prefix matching is the easiest way to accidentally expose an admin endpoint.
// The negative cases matter more than the positive ones here.
const mustBePublic = ['/health', '/lead', '/intake/abc123', '/intake/', '/portal/abc123', '/portal/'];
const mustBeGuarded = [
  '/intake-link',      // admin: mints share tokens. Must NOT match '/intake/'.
  '/portal-link',      // admin: mints portal tokens. Must NOT match '/portal/'.
  '/portal',           // no trailing slash — not a portal route
  '/intake',           // no trailing slash — not a portal route
  '/deploy',           // would let anyone publish to the Cloudflare account
  '/invoice',          // would let anyone generate Stripe invoices
  '/templates',
  '/studio-chat',      // would burn Gemini quota
  '/domains/add',
  '/healthz',          // near-miss on '/health'
  '/leads',            // near-miss on '/lead'
];

for (const p of mustBePublic) check(`public: ${p}`, isPublicApiPath(p), true);
for (const p of mustBeGuarded) check(`guarded: ${p}`, isPublicApiPath(p), false);

// --- The client tier ---------------------------------------------------------
//
// /api/client/* skips requireAdmin, because no salon owner is on the operator
// allowlist and the admin gate would reject every one of them. That skip is only
// safe while two things hold, and both are asserted here:
//
//   1. isClientApiPath matches nothing outside that prefix, and
//   2. every route defined under it mounts its own per-project gate.
//
// The second is the one that would kill us quietly. A new /api/client/ route
// added without `clientGate` is not merely under-protected — it is completely
// open, because the middleware above waved it past the admin check on the
// strength of its prefix.

const mustBeClientTier = ['/client/projects', '/client/abc/media', '/client/abc/access'];
const mustNotBeClientTier = [
  '/client',           // no trailing slash
  '/clients',          // near-miss
  '/client-export',    // a future admin route must not fall through the gate
  '/deploy',
  '/portal/abc123',
];

for (const p of mustBeClientTier) check(`client tier: ${p}`, isClientApiPath(p), true);
for (const p of mustNotBeClientTier) check(`not client tier: ${p}`, isClientApiPath(p), false);

// The client tier and the public tier must never overlap. A path in both would
// be served with no session at all while looking gated in review.
for (const p of [...mustBeClientTier, ...mustBeGuarded]) {
  check(`not public: ${p}`, isPublicApiPath(p), false);
}

// Static check: no /api/client/ route may be registered without a gate.
{
  const { readFileSync } = await import('fs');
  const { join } = await import('path');
  const source = readFileSync(join(process.cwd(), 'server.ts'), 'utf8');

  // app.get("/api/client/...", <what comes next>
  const routes = [...source.matchAll(/app\.(get|post|put|patch|delete)\(\s*["'`]\/api\/client\/[^"'`]*["'`]\s*,\s*([A-Za-z_$][\w$]*)/g)];
  check('client routes are found by the scanner at all', routes.length > 0, true);

  // Two gates are legitimate, and only two. clientGate resolves membership for
  // the project named in the path; requireClientSession is the single deliberate
  // exception, for the route that lists which projects exist for this session
  // and therefore cannot name one. Anything else is a forgotten gate.
  const ALLOWED_GATES = ['clientGate', 'requireClientSession'];
  const ungated = routes
    .filter(m => !ALLOWED_GATES.includes(m[2]))
    .map(m => m[0].slice(0, 60));
  check('every /api/client/ route mounts a client gate', ungated, []);
}

// --- Model routing config ---------------------------------------------------

// A malformed override must fall back to the default, not silently route a task
// to a model that does not exist and fail at call time.
const originalOverride = process.env.MODEL_ASSISTANT;

delete process.env.MODEL_ASSISTANT;
check('assistant defaults to gemini', resolveModel('assistant').provider, 'gemini');

process.env.MODEL_ASSISTANT = 'openrouter:deepseek/deepseek-chat';
check('override switches provider', resolveModel('assistant').provider, 'openrouter');
check('override keeps the full model id including the slash',
  resolveModel('assistant').model, 'deepseek/deepseek-chat');

process.env.MODEL_ASSISTANT = 'deepseek/deepseek-chat';  // missing provider prefix
check('override without a provider falls back', resolveModel('assistant').provider, 'gemini');

process.env.MODEL_ASSISTANT = 'notaprovider:some-model';
check('unknown provider falls back', resolveModel('assistant').provider, 'gemini');

process.env.MODEL_ASSISTANT = 'openrouter:';
check('provider with no model falls back', resolveModel('assistant').provider, 'gemini');

if (originalOverride === undefined) delete process.env.MODEL_ASSISTANT;
else process.env.MODEL_ASSISTANT = originalOverride;

// extract-dossier is multimodal; its default must stay on Gemini.
check('dossier extraction defaults to gemini (multimodal)',
  resolveModel('extract-dossier').provider, 'gemini');

// --- Service-role key must never reach the browser -------------------------

// Vite inlines any VITE_-prefixed var into the client bundle. A service-role key
// there would hand every visitor full read/write on the database, bypassing RLS.
const leakyEnvNames = Object.keys(process.env).filter(
  name => name.startsWith('VITE_') && /service[_-]?role/i.test(name)
);
check('no VITE_-prefixed service-role env var', leakyEnvNames, []);

// If a build exists, confirm the key value itself is not baked into it.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey && serviceKey.length > 20) {
  const { existsSync, readdirSync, readFileSync } = await import('fs');
  const { join } = await import('path');
  const assetsDir = join(process.cwd(), 'dist', 'assets');

  if (existsSync(assetsDir)) {
    const leaked = readdirSync(assetsDir)
      .filter(f => f.endsWith('.js'))
      .filter(f => readFileSync(join(assetsDir, f), 'utf8').includes(serviceKey));
    check('service-role key absent from built client bundle', leaked, []);
  } else {
    console.log('  (skipped bundle scan — dist/assets not built yet)');
  }
}

// --- .env.example must never carry a real credential -------------------------
//
// .gitignore excludes .env* but re-includes .env.example, so it is the one file
// in the family that commits and pushes. On 2026-08-30 two live GitHub
// fine-grained tokens were pasted into it — the template was mistaken for the
// config. They were caught before any commit, but only because someone looked.
//
// Every value in that file should be empty or an obvious placeholder. This
// matches on credential *shape*, so it catches tokens nobody has thought to
// enumerate, and it fails the build rather than warning.
{
  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');
  const examplePath = join(process.cwd(), '.env.example');

  const CREDENTIAL_SHAPES: Array<[string, RegExp]> = [
    ['GitHub fine-grained token', /github_pat_[A-Za-z0-9_]{20,}/],
    ['GitHub classic token', /gh[pousr]_[A-Za-z0-9]{20,}/],
    ['Supabase / JWT', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./],
    ['Stripe key', /sk_(live|test)_[A-Za-z0-9]{16,}/],
    ['OpenAI-style key', /sk-[A-Za-z0-9]{32,}/],
    ['OpenRouter key', /sk-or-v1-[A-Za-z0-9]{16,}/],
    ['Google API key', /AIza[A-Za-z0-9_-]{30,}/],
  ];

  if (existsSync(examplePath)) {
    const text = readFileSync(examplePath, 'utf8');
    const found = CREDENTIAL_SHAPES.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
    // Names only — printing the match would put the secret in CI logs, which is
    // the problem this check exists to prevent.
    check('.env.example carries no real credentials', found, []);
  } else {
    console.log('  (skipped .env.example scan — file not present)');
  }
}


// --- CORS origins ------------------------------------------------------------
//
// Deployed client sites are cross-origin to this server, so they need CORS to
// post a lead at all. The allowlist is not a security boundary — curl ignores
// CORS entirely and every client route still needs a Bearer token — but a
// pattern that matches too much is still worth catching, because the classic
// way an allowlist like this fails is a suffix test that forgets to anchor.

const savedAppUrl = process.env.APP_URL;
const savedOrigins = process.env.CLIENT_SITE_ORIGINS;
process.env.APP_URL = 'https://texas-sons-production.up.railway.app';
process.env.CLIENT_SITE_ORIGINS = 'https://opalescentcolorstudio.com';

for (const o of [
  'https://opalescent.pages.dev',
  'https://some-site-abc123.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://texas-sons-production.up.railway.app',
  'https://opalescentcolorstudio.com',
]) check(`origin allowed: ${o}`, isAllowedClientOrigin(o), true);

for (const o of [
  'https://pages.dev.attacker.com',   // the anchoring bug this pattern exists to avoid
  'https://evil.com',
  'http://opalescent.pages.dev',      // http, not https
  'https://opalescent.pages.dev.evil.com',
  'https://notopalescentcolorstudio.com',
  'null',                             // sandboxed iframe or file:// page
  '*',
  '',
  undefined,
]) check(`origin refused: ${String(o)}`, isAllowedClientOrigin(o), false);

process.env.APP_URL = savedAppUrl;
process.env.CLIENT_SITE_ORIGINS = savedOrigins;

// --- Result ----------------------------------------------------------------

if (failures > 0) {
  console.error(`\nSECURITY SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log(
  `SECURITY SMOKE PASS: ${mustBlock.length + mustAllow.length} address checks, ` +
  `4 fetch refusals, 3 allowlist checks, ` +
  `${mustBePublic.length + mustBeGuarded.length} route-gate checks, ` +
  `${mustBeClientTier.length + mustNotBeClientTier.length} client-tier checks, ` +
  `every /api/client route gated, 15 CORS origin checks, .env.example clean`
);
