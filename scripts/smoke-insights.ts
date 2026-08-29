/**
 * Tests for the derived views over the event log.
 *
 * These functions produce the numbers Morgan will make decisions from — "stop
 * cold-emailing restaurants", "you researched 34 prospects and contacted 6". A
 * funnel that quietly double-counts is worse than no funnel, because it looks
 * authoritative. Same failure mode as the fabricated usage stats removed on
 * 2026-08-28.
 */

import {
  buildFunnel,
  conversionByVertical,
  medianDaysToLive,
  researchedNotContacted,
  type StoredEvent,
  type EventKind,
} from '../src/store/insights';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}

let seq = 0;
function ev(
  kind: EventKind,
  opts: { intakeId?: string; prospectId?: string; vertical?: string; day?: number } = {}
): StoredEvent {
  seq++;
  const day = opts.day ?? 0;
  return {
    id: `e${seq}`,
    kind,
    intakeId: opts.intakeId,
    prospectId: opts.prospectId,
    vertical: opts.vertical,
    data: {},
    // Fixed epoch base so the tests are deterministic.
    createdAt: new Date(1_780_000_000_000 + day * 86_400_000).toISOString(),
  };
}

// --- funnel counts subjects, not events -------------------------------------

const regenerated = [
  ev('prospect_saved', { prospectId: 'p1', vertical: 'Food' }),
  ev('demo_deployed', { intakeId: 'c1', vertical: 'Food' }),
  ev('demo_deployed', { intakeId: 'c1', vertical: 'Food' }), // redeployed
  ev('demo_deployed', { intakeId: 'c1', vertical: 'Food' }), // and again
];

const funnel = buildFunnel(regenerated);
const deployed = funnel.find(s => s.kind === 'demo_deployed');
check('three redeploys of one client count once', deployed?.count, 1);
check('funnel keeps every stage even at zero', funnel.length, 7);
check('a stage with no events reports zero, not missing',
  funnel.find(s => s.kind === 'converted')?.count, 0);

// Scoping by vertical must not leak other verticals in.
const mixed = [
  ev('demo_deployed', { intakeId: 'a', vertical: 'Food' }),
  ev('demo_deployed', { intakeId: 'b', vertical: 'Trades' }),
];
check('funnel scoped to one vertical',
  buildFunnel(mixed, 'Food').find(s => s.kind === 'demo_deployed')?.count, 1);

// --- conversion by vertical --------------------------------------------------

const conversions = [
  // Campaigns: 2 contacted, 1 converted
  ev('outreach_sent', { intakeId: 'c1', vertical: 'Campaign' }),
  ev('outreach_sent', { intakeId: 'c2', vertical: 'Campaign' }),
  ev('converted',     { intakeId: 'c1', vertical: 'Campaign' }),
  // Restaurants: 4 contacted, 0 converted
  ev('outreach_sent', { intakeId: 'r1', vertical: 'Food' }),
  ev('outreach_sent', { intakeId: 'r2', vertical: 'Food' }),
  ev('outreach_sent', { intakeId: 'r3', vertical: 'Food' }),
  ev('outreach_sent', { intakeId: 'r4', vertical: 'Food' }),
];

const byVertical = conversionByVertical(conversions);
check('best-converting vertical leads', byVertical[0].vertical, 'Campaign');
check('campaign rate is 1 of 2', byVertical[0].rate, 0.5);
check('food converted none', byVertical.find(v => v.vertical === 'Food')?.converted, 0);
check('food rate is zero, not NaN', byVertical.find(v => v.vertical === 'Food')?.rate, 0);
check('reached counts contacted clients', byVertical.find(v => v.vertical === 'Food')?.reached, 4);

// Contacting the same client twice is one client, not two.
check('duplicate outreach to one client counts once',
  conversionByVertical([
    ev('outreach_sent', { intakeId: 'x', vertical: 'V' }),
    ev('outreach_sent', { intakeId: 'x', vertical: 'V' }),
  ])[0].reached, 1);

// A vertical nobody was contacted in must not divide by zero.
check('no outreach yields rate zero',
  conversionByVertical([ev('prospect_saved', { prospectId: 'z', vertical: 'Quiet' })])[0].rate, 0);

// --- time to live ------------------------------------------------------------

const timeline = [
  ev('prospect_saved', { intakeId: 'c1', day: 0 }),
  ev('site_shipped',   { intakeId: 'c1', day: 10 }),
  ev('prospect_saved', { intakeId: 'c2', day: 0 }),
  ev('site_shipped',   { intakeId: 'c2', day: 20 }),
  ev('prospect_saved', { intakeId: 'c3', day: 0 }),
  ev('site_shipped',   { intakeId: 'c3', day: 30 }),
];
check('median of 10/20/30 days is 20', medianDaysToLive(timeline), 20);
check('even counts average the middle pair', medianDaysToLive(timeline.slice(0, 4)), 15);
check('no shipped sites yields null, not zero',
  medianDaysToLive([ev('prospect_saved', { intakeId: 'c1' })]), null);

// --- the leak ----------------------------------------------------------------

const leak = [
  ev('assets_gathered', { prospectId: 'p1' }),
  ev('assets_gathered', { prospectId: 'p2' }),
  ev('assets_gathered', { prospectId: 'p3' }),
  ev('outreach_sent',   { prospectId: 'p1' }),
];
check('researched but never contacted', researchedNotContacted(leak), 2);
check('nothing researched yields zero', researchedNotContacted([]), 0);

// --- empty input --------------------------------------------------------------

check('empty log yields a full zeroed funnel', buildFunnel([]).every(s => s.count === 0), true);
check('empty log yields no verticals', conversionByVertical([]), []);

// --- Result -------------------------------------------------------------------

if (failures > 0) {
  console.error(`\nINSIGHTS SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('INSIGHTS SMOKE PASS: funnel counts subjects not events; rates, medians and leaks are correct on empty and duplicate input');
