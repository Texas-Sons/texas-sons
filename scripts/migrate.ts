/**
 * Applies pending SQL migrations to Supabase.
 *
 * Eleven migrations shipped before this existed, and every one of them was
 * pasted into the dashboard SQL editor by hand. That is slow, it is unrepeatable,
 * and nothing anywhere recorded which of them had actually been applied to which
 * environment — so "did that migration land?" could only be answered by querying
 * for the thing it was supposed to create.
 *
 * Runs over the Management API rather than a Postgres connection on purpose: the
 * access token it needs is the same one the Supabase MCP server uses, so the
 * operator creates one credential instead of two. The cost is that this cannot
 * run inside a transaction spanning statements the API splits — see `applySql`.
 *
 *   npm run migrate           apply everything pending
 *   npm run migrate -- --dry  list what would run, touch nothing
 *
 * Safe to run repeatedly. Applied migrations are recorded in `schema_migrations`
 * and skipped thereafter.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const API = 'https://api.supabase.com/v1';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectUrl = process.env.VITE_SUPABASE_URL || '';
const dryRun = process.argv.includes('--dry');

/**
 * The project ref is the subdomain of the Supabase URL. Derived rather than
 * configured separately: two env vars that must agree is one more thing to get
 * wrong, and VITE_SUPABASE_URL is already required for the app to boot at all.
 */
function projectRef(): string {
  const m = projectUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (!m) {
    fail(
      'VITE_SUPABASE_URL is missing or not a Supabase URL, so the project ref could not be derived.\n' +
      'Expected something of the form https://<ref>.supabase.co'
    );
  }
  return m![1];
}

function fail(message: string): never {
  console.error(`\n  migrate: ${message}\n`);
  process.exit(1);
}

/**
 * Runs SQL through the Management API.
 *
 * The endpoint accepts a whole script, so a migration file is sent as one unit
 * and Postgres treats it as a single implicit transaction — a file that fails
 * halfway leaves nothing behind. That is the property that makes re-running this
 * safe, and it is why the file is not split on semicolons here: splitting would
 * break `$$ ... $$` function bodies and would also give up the all-or-nothing.
 */
async function applySql(ref: string, sql: string): Promise<void> {
  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // 401 is the common one and its default message is unhelpful, so name the
    // likely cause rather than printing "Unauthorized" and stopping.
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `the access token was rejected (HTTP ${res.status}).\n` +
        '        Check SUPABASE_ACCESS_TOKEN is a personal access token from\n' +
        '        Supabase > Account > Access Tokens, not the service role key.'
      );
    }
    throw new Error(`HTTP ${res.status} ${body.slice(0, 600)}`);
  }
}

async function query<T = any>(ref: string, sql: string): Promise<T[]> {
  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${body.slice(0, 600)}`);
  }
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : [];
}

async function main() {
  if (!token) {
    fail(
      'SUPABASE_ACCESS_TOKEN is not set.\n' +
      '        Create one at Supabase > Account > Access Tokens, then add it to\n' +
      '        .env.local as SUPABASE_ACCESS_TOKEN=...\n' +
      '        The same token powers the Supabase MCP server in .mcp.json.'
    );
  }

  const ref = projectRef();

  let files: string[];
  try {
    files = (await fs.readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort();
  } catch {
    fail(`no migrations directory at ${MIGRATIONS_DIR}`);
  }

  if (files!.length === 0) {
    console.log('  migrate: no migration files found.');
    return;
  }

  // The ledger. Created by this script rather than by a migration of its own,
  // because a migration recording migrations cannot record itself.
  await applySql(ref, `
    create table if not exists public.schema_migrations (
      name        text primary key,
      checksum    text not null,
      applied_at  timestamptz not null default now()
    );
  `);

  const applied = await query<{ name: string; checksum: string }>(
    ref, 'select name, checksum from public.schema_migrations;'
  );
  const appliedBy = new Map(applied.map(r => [r.name, r.checksum]));

  const pending: { name: string; sql: string; checksum: string }[] = [];
  let drifted = 0;

  for (const name of files!) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), 'utf-8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex').slice(0, 16);
    const previous = appliedBy.get(name);

    if (previous === undefined) {
      pending.push({ name, sql, checksum });
    } else if (previous !== checksum) {
      // Editing an applied migration means the database and the repository
      // disagree and no amount of re-running will reconcile them. Report it and
      // keep going; the fix is a new migration, never a quiet re-apply.
      drifted++;
      console.warn(`  DRIFT  ${name} was edited after it was applied — write a new migration instead.`);
    }
  }

  if (pending.length === 0) {
    console.log(`  migrate: up to date (${files!.length} applied).`);
    if (drifted) process.exitCode = 1;
    return;
  }

  console.log(`  migrate: ${pending.length} pending of ${files!.length}\n`);
  for (const m of pending) console.log(`    ${dryRun ? 'would apply' : 'pending'}  ${m.name}`);

  if (dryRun) {
    console.log('\n  migrate: dry run, nothing applied.');
    return;
  }

  console.log('');
  for (const m of pending) {
    process.stdout.write(`    applying  ${m.name} ... `);
    try {
      await applySql(ref, m.sql);
      // Recorded only after the migration itself succeeded. The reverse order
      // would mark a failed migration as done and skip it forever.
      await applySql(ref, `
        insert into public.schema_migrations (name, checksum)
        values ('${m.name.replace(/'/g, "''")}', '${m.checksum}')
        on conflict (name) do update set checksum = excluded.checksum;
      `);
      console.log('ok');
    } catch (err: any) {
      console.log('FAILED');
      fail(`${m.name} did not apply.\n        ${err?.message || err}`);
    }
  }

  console.log(`\n  migrate: applied ${pending.length}.`);
  if (drifted) process.exitCode = 1;
}

main().catch(err => fail(err?.message || String(err)));
