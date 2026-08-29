/**
 * Security smoke tests. Run by `npm test` and enforced in CI.
 *
 * These guard two things that are easy to silently regress:
 *   1. the SSRF blocklist in lib/safeFetch (someone "simplifies" it back to fetch)
 *   2. the admin allowlist parsing in lib/auth
 */

import { isBlockedAddress, safeFetchText } from '../lib/safeFetch';
import { getAdminEmails, isPublicApiPath } from '../lib/auth';
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
const mustBePublic = ['/health', '/lead', '/intake/abc123', '/intake/'];
const mustBeGuarded = [
  '/intake-link',      // admin: mints share tokens. Must NOT match '/intake/'.
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

// --- Result ----------------------------------------------------------------

if (failures > 0) {
  console.error(`\nSECURITY SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log(`SECURITY SMOKE PASS: ${mustBlock.length + mustAllow.length} address checks, 4 fetch refusals, 3 allowlist checks, ${mustBePublic.length + mustBeGuarded.length} route-gate checks`);
