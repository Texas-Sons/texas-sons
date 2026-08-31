/**
 * Client stage smoke test.
 *
 * Two things here are worth pinning. The publish state is what tells the
 * operator whether customers are seeing their latest work — getting it backwards
 * is how a stale blueprint sat around waiting to be republished over a live
 * salon site. And the demo/commissioned filter must never silence a fabricated
 * claim, because a demo goes to the owner, about her own business.
 */

import { stageOf, publishStateOf } from '../src/utils/clientStage';
import { issuesFor } from '../src/utils/blueprintHealth';

let failures = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const REAL = {
  profile: {
    name: 'Opalescent', tagline: 'Luxury Hair & Color Artistry',
    description: 'San Antonio hair studio.', heroImage: 'https://cdn.example/hero.jpg',
    phone: '(210) 493-8811', email: 'hello@opalescent.com',
  },
  services: [{ title: 'Balayage', description: 'Full head', price: '$350' }],
  testimonials: [],
};

// --- publish state ----------------------------------------------------------

check('never published', publishStateOf({ updatedAt: '2026-08-31T10:00:00Z' }) === 'never');
check('published and untouched',
  publishStateOf({ publishedAt: '2026-08-31T10:00:00Z', updatedAt: '2026-08-31T10:00:00Z' }) === 'current');
check('edited after publishing',
  publishStateOf({ publishedAt: '2026-08-31T10:00:00Z', updatedAt: '2026-08-31T11:00:00Z' }) === 'stale');
// saveProject and the publish stamp themselves moments apart; a publish that
// instantly reports "not published" teaches the operator to ignore the label.
check('a second of slack is not staleness',
  publishStateOf({ publishedAt: '2026-08-31T10:00:00Z', updatedAt: '2026-08-31T10:00:00.400Z' }) === 'current');

// --- stage sequencing -------------------------------------------------------

check('no site means build one', stageOf({}).primary === 'launch-studio');
check('no site has no stage issues', stageOf({}).issues.length === 0);

check('an unpublished site wants publishing',
  stageOf({ project: { blueprint: REAL, updatedAt: 'x' } }).primary === 'publish');

const liveDemo = { project: { blueprint: REAL, engagement: 'demo' as const, publishedAt: '2026-08-31T10:00:00Z', updatedAt: '2026-08-31T10:00:00Z' } };
check('a published demo wants a proposal', stageOf(liveDemo).primary === 'proposal', stageOf(liveDemo).primary);
check('a published demo is staged as demo', stageOf(liveDemo).stage === 'demo');

const liveClient = { project: { blueprint: REAL, engagement: 'commissioned' as const, publishedAt: '2026-08-31T10:00:00Z', updatedAt: '2026-08-31T10:00:00Z' } };
check('a live client wants their access managed', stageOf(liveClient).primary === 'client-access');

// Unpublished edits outrank everything: customers are looking at the old one.
const edited = { project: { ...liveClient.project, updatedAt: '2026-08-31T12:00:00Z' } };
check('unpublished edits take priority', stageOf(edited).primary === 'publish', stageOf(edited).primary);
check('and are reported as stale', stageOf(edited).publish === 'stale');

// --- what a demo is and is not warned about ---------------------------------

const thin = { profile: { name: 'X', phone: '', heroImage: '' }, services: [] };

check('a demo is not nagged about missing data',
  issuesFor(thin, 'demo').length === 0, JSON.stringify(issuesFor(thin, 'demo').map(i => i.field)));
check('a paying client is', issuesFor(thin, 'commissioned').length > 0);

// The one thing a demo is never excused. It goes to the owner, about her own
// business: she either assumes it was verified or notices it was invented.
const invented = {
  profile: { name: 'X', phone: '(210) 493-8811', heroImage: 'h', tagline: 't', description: 'd', email: 'a@b.com' },
  services: [{ title: 'Cut' }],
  badges: ['Satisfaction Guaranteed'],
  testimonials: [{ quote: 'Exceptional service and unmatched attention to detail', author: 'Verified Client' }],
};
const demoIssues = issuesFor(invented, 'demo');
check('invented claims are flagged even in a demo', demoIssues.length > 0,
  JSON.stringify(demoIssues.map(i => i.field)));
check('and only claims are', demoIssues.every(i => i.category === 'claim'));
check('stageOf surfaces that', stageOf({ project: { blueprint: invented } }).hasClaimIssues === true);

if (failures > 0) {
  console.error(`\nSTAGE SMOKE FAILED: ${failures} check(s)`);
  process.exit(1);
}
console.log('STAGE SMOKE PASS: publish state is directional, sequencing follows the pipeline, demos hide missing data but never invented claims');
