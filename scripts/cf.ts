/**
 * Cloudflare Pages status from the command line.
 *
 * Answers "is it live, and which build is it?" without opening a dashboard —
 * the question that came up seven separate times during the Opalescent build,
 * usually phrased as "I still dont see the updates after refresh".
 *
 * Uses CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, which .env.local already
 * carries and server.ts already uses. No new credential, nothing to authorise.
 *
 *   npm run cf                 list every client site and when it last deployed
 *   npm run cf -- <slug>       the last five deployments of one site
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const CF = 'https://api.cloudflare.com/client/v4';

function fail(message: string): never {
  console.error(`\n  cf: ${message}\n`);
  process.exit(1);
}

async function cf<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiToken}` } });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const detail = json?.errors?.map((e: any) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return json.result;
}

/** "3h ago" reads faster than an ISO timestamp when you are checking staleness. */
function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

async function main() {
  if (!accountId || !apiToken) {
    fail('CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is missing from .env.local.');
  }

  const slug = process.argv[2];

  if (slug) {
    const deployments = await cf<any[]>(
      `${CF}/accounts/${accountId}/pages/projects/${slug}/deployments`
    );
    if (!deployments?.length) {
      console.log(`\n  ${slug}: no deployments.\n`);
      return;
    }
    console.log(`\n  ${slug}\n`);
    for (const d of deployments.slice(0, 5)) {
      const stage = d.latest_stage?.status || 'unknown';
      const mark = stage === 'success' ? 'ok  ' : stage === 'failure' ? 'FAIL' : '... ';
      console.log(
        `    ${mark}  ${ago(d.created_on).padEnd(10)}  ${String(d.id).slice(0, 8)}  ${d.url || ''}`
      );
    }
    console.log('');
    return;
  }

  const projects = await cf<any[]>(`${CF}/accounts/${accountId}/pages/projects`);
  if (!projects?.length) {
    console.log('\n  cf: no Pages projects on this account.\n');
    return;
  }

  console.log(`\n  ${projects.length} client site${projects.length === 1 ? '' : 's'}\n`);
  for (const p of projects) {
    const d = p.latest_deployment;
    const stage = d?.latest_stage?.status;
    const mark = !d ? '--  ' : stage === 'success' ? 'ok  ' : stage === 'failure' ? 'FAIL' : '... ';
    const when = d?.created_on ? ago(d.created_on) : 'never deployed';
    console.log(`    ${mark}  ${String(p.name).padEnd(34)}  ${when}`);
  }
  console.log('\n  npm run cf -- <name>   for one site\n');
}

main().catch(err => fail(err?.message || String(err)));
