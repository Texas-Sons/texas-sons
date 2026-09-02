/**
 * Which credentials this process actually has.
 *
 * A key set in .env.local and absent from Railway fails silently: the feature it
 * powers just stops, in a way that looks like a bug in the feature. That is
 * exactly how "server: openRouterConfigured=false" was discovered — by reading
 * an incidental log line, days later, while looking for something else.
 *
 * .env.example lists every variable and what it powers. Nothing compared that
 * list to reality, so this does.
 *
 * **Never logs or returns a value.** Presence and shape only. The point is to
 * say "STRIPE_SECRET_KEY is missing", never to help anybody read it back out of
 * a log, and a health endpoint that echoed secrets would be far worse than the
 * problem it solved.
 */

export type EnvSeverity = 'required' | 'optional';

interface EnvSpec {
  name: string;
  severity: EnvSeverity;
  /** What stops working without it, in the operator's terms. */
  powers: string;
  /**
   * Optional shape check. Catches the pasted-the-wrong-thing case, which is
   * commoner than the forgot-to-paste-anything case and much harder to see:
   * a service role key in SUPABASE_ACCESS_TOKEN looks set and fails at use.
   */
  expect?: (v: string) => boolean;
}

const SPECS: EnvSpec[] = [
  { name: 'VITE_SUPABASE_URL', severity: 'required', powers: 'the database — nothing loads without it',
    expect: v => /^https:\/\/[a-z0-9]+\.supabase\.co/i.test(v) },
  { name: 'VITE_SUPABASE_ANON_KEY', severity: 'required', powers: 'signing in' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', severity: 'required', powers: 'lead capture and the client intake portal' },
  { name: 'ADMIN_EMAILS', severity: 'required', powers: 'the admin allowlist — every /api route' },

  { name: 'CLOUDFLARE_ACCOUNT_ID', severity: 'required', powers: 'publishing client sites' },
  { name: 'CLOUDFLARE_API_TOKEN', severity: 'required', powers: 'publishing client sites' },

  { name: 'GEMINI_API_KEY', severity: 'required', powers: 'site generation and the menu scanner' },
  { name: 'OPENROUTER_API_KEY', severity: 'optional', powers: 'the DeepSeek models in the assistant' },
  { name: 'MODEL_ASSISTANT', severity: 'optional', powers: 'which model the assistant defaults to' },

  { name: 'APP_URL', severity: 'optional', powers: 'intake links sent to clients' },
  { name: 'STRIPE_SECRET_KEY', severity: 'optional', powers: 'invoicing' },
  { name: 'VITE_GOOGLE_MAPS_PLATFORM_KEY', severity: 'optional', powers: 'the prospect search' },
  { name: 'GITHUB_ACCESS_TOKEN', severity: 'optional', powers: 'template sync' },
  { name: 'VAULT_GITHUB_TOKEN', severity: 'optional', powers: 'the Obsidian vault sync' },
  { name: 'CLIENT_SITE_ORIGINS', severity: 'optional', powers: 'CORS for deployed client sites' },

  // Not needed to run the app — only to change the schema. Optional on purpose:
  // production has no business holding a token that can rewrite the database.
  { name: 'SUPABASE_ACCESS_TOKEN', severity: 'optional', powers: 'npm run migrate and the Supabase MCP server',
    expect: v => !v.startsWith('eyJ') },
];

export interface EnvStatus {
  name: string;
  severity: EnvSeverity;
  powers: string;
  present: boolean;
  /** True when it is set but fails its shape check. */
  malformed: boolean;
}

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvStatus[] {
  return SPECS.map(spec => {
    const raw = env[spec.name];
    const value = typeof raw === 'string' ? raw.trim() : '';
    const present = value.length > 0;
    return {
      name: spec.name,
      severity: spec.severity,
      powers: spec.powers,
      present,
      malformed: present && spec.expect ? !spec.expect(value) : false,
    };
  });
}

/**
 * One block at startup naming everything missing.
 *
 * Silent when everything required is present and well-formed — a healthy boot
 * should not print a wall of green that trains you to skip past it.
 */
export function logEnvStatus(env: NodeJS.ProcessEnv = process.env): void {
  const status = checkEnv(env);
  const missingRequired = status.filter(s => s.severity === 'required' && !s.present);
  const malformed = status.filter(s => s.malformed);
  const missingOptional = status.filter(s => s.severity === 'optional' && !s.present);

  if (!missingRequired.length && !malformed.length) {
    if (missingOptional.length) {
      console.log(`[env] ok — ${missingOptional.length} optional not set: ${missingOptional.map(s => s.name).join(', ')}`);
    }
    return;
  }

  console.warn('\n[env] ---------------------------------------------------------');
  for (const s of missingRequired) {
    console.warn(`[env] MISSING   ${s.name.padEnd(30)} ${s.powers}`);
  }
  for (const s of malformed) {
    console.warn(`[env] SUSPECT   ${s.name.padEnd(30)} set, but not the shape expected`);
  }
  if (missingOptional.length) {
    console.warn(`[env] not set   ${missingOptional.map(s => s.name).join(', ')}`);
  }
  console.warn('[env] See .env.example for what each one powers.');
  console.warn('[env] ---------------------------------------------------------\n');
}
