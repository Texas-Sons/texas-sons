/**
 * Tests for the credential report and the build identity.
 *
 * Two things are pinned here, and the second one is a regression guard for a
 * mistake made while writing the first.
 *
 * 1. checkEnv reports presence and shape, never a value. Its whole reason to
 *    exist is that a key set locally and missing in production fails silently;
 *    a version of it that echoed the key would be far worse than the problem.
 *
 * 2. /api/health does not name credentials. That endpoint is public — it is in
 *    PUBLIC_API_PATHS because a liveness probe has no session — and the first
 *    version of this feature put the list of missing variables on it. No values,
 *    but a public list of unconfigured integrations is a map of where a
 *    deployment is weakest. It belongs behind the admin gate, on /api/env-status.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { checkEnv, logEnvStatus } from '../lib/envCheck';
import { buildInfo } from '../lib/buildInfo';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label: string, actual: boolean) {
  if (!actual) { failures++; console.error(`  FAIL  ${label}`); }
}

// --- no value ever escapes ---------------------------------------------------

const SECRET = 'sk_live_do_not_leak_this_value_anywhere';
const fake = {
  VITE_SUPABASE_URL: 'https://abcdefg.supabase.co',
  VITE_SUPABASE_ANON_KEY: SECRET,
  SUPABASE_SERVICE_ROLE_KEY: SECRET,
  ADMIN_EMAILS: 'someone@example.com',
  CLOUDFLARE_ACCOUNT_ID: SECRET,
  CLOUDFLARE_API_TOKEN: SECRET,
  GEMINI_API_KEY: SECRET,
} as NodeJS.ProcessEnv;

const status = checkEnv(fake);
checkTrue('no status entry carries a value',
  !JSON.stringify(status).includes(SECRET));

checkTrue('every entry reports presence as a boolean',
  status.every(s => typeof s.present === 'boolean' && typeof s.malformed === 'boolean'));

// --- presence ----------------------------------------------------------------

const by = (name: string) => status.find(s => s.name === name)!;

check('a set variable reads as present', by('GEMINI_API_KEY').present, true);
check('an unset variable reads as absent', by('STRIPE_SECRET_KEY').present, false);
check('an unset optional is not malformed', by('STRIPE_SECRET_KEY').malformed, false);

check('an empty string is not present',
  checkEnv({ ...fake, GEMINI_API_KEY: '' }).find(s => s.name === 'GEMINI_API_KEY')!.present, false);

check('whitespace only is not present',
  checkEnv({ ...fake, GEMINI_API_KEY: '   ' }).find(s => s.name === 'GEMINI_API_KEY')!.present, false);

// --- shape checks catch the pasted-the-wrong-thing case ----------------------

check('a supabase url of the wrong shape is malformed',
  checkEnv({ ...fake, VITE_SUPABASE_URL: 'http://localhost:54321' })
    .find(s => s.name === 'VITE_SUPABASE_URL')!.malformed, true);

check('a real supabase url is not malformed',
  by('VITE_SUPABASE_URL').malformed, false);

// A service role key is a JWT and starts with eyJ; a personal access token does
// not. Pasting one where the other belongs looks configured and fails at use.
check('a JWT in SUPABASE_ACCESS_TOKEN is flagged',
  checkEnv({ ...fake, SUPABASE_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIs' })
    .find(s => s.name === 'SUPABASE_ACCESS_TOKEN')!.malformed, true);

check('a personal access token is not flagged',
  checkEnv({ ...fake, SUPABASE_ACCESS_TOKEN: 'sbp_0123456789abcdef' })
    .find(s => s.name === 'SUPABASE_ACCESS_TOKEN')!.malformed, false);

// --- required vs optional ----------------------------------------------------

check('the migration token is optional — production has no business holding it',
  by('SUPABASE_ACCESS_TOKEN').severity, 'optional');

check('the service role key is required',
  by('SUPABASE_SERVICE_ROLE_KEY').severity, 'required');

// --- the logger prints no values ---------------------------------------------

{
  const lines: string[] = [];
  const warn = console.warn, log = console.log;
  console.warn = (...a: any[]) => { lines.push(a.join(' ')); };
  console.log = (...a: any[]) => { lines.push(a.join(' ')); };
  try {
    logEnvStatus(fake);
  } finally {
    console.warn = warn;
    console.log = log;
  }
  checkTrue('logEnvStatus never prints a value', !lines.join('\n').includes(SECRET));
}

// --- /api/health must not name credentials -----------------------------------

{
  const source = readFileSync(join(process.cwd(), 'server.ts'), 'utf8');

  // The handler body, from the route to the end of its res.json call.
  const health = source.slice(source.indexOf('app.get("/api/health"'));
  const healthBody = health.slice(0, health.indexOf('});') + 3);

  checkTrue('/api/health does not call checkEnv',
    !healthBody.includes('checkEnv'));
  checkTrue('/api/health does not report missing variables',
    !/missingRequired|malformed|configured/.test(healthBody));
  checkTrue('/api/health still reports the build',
    healthBody.includes('buildInfo'));

  checkTrue('/api/env-status exists and is not in the public path list',
    source.includes('app.get("/api/env-status"'));

  const auth = readFileSync(join(process.cwd(), 'lib', 'auth.ts'), 'utf8');
  checkTrue('env-status is not exempted from the admin gate',
    !auth.includes("'/env-status'") && !auth.includes('"/env-status"'));
}

// --- build identity ----------------------------------------------------------

{
  const info = buildInfo();
  checkTrue('a commit is reported', typeof info.commit === 'string' && info.commit.length > 0);
  checkTrue('startedAt parses as a date', !Number.isNaN(Date.parse(info.startedAt)));
  checkTrue('mode is one of two known values',
    info.mode === 'production' || info.mode === 'development');
}

if (failures) {
  console.error(`\n  smoke-env: ${failures} failed\n`);
  process.exit(1);
}
console.log('  smoke-env: ok — no value escapes, and /api/health names no credentials');
