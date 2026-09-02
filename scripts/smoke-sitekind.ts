/**
 * Tests for what kind of site a blueprint describes.
 *
 * This decides whether a business gets a service menu or a campaign platform,
 * so the rules need pinning. The one that matters most: a salon must never be
 * treated as a campaign because of the colour it is painted — that is what was
 * silently cutting a nine-service menu down to three pillars on every build.
 */

import { isCampaignSite, isWriteInCampaign, CAMPAIGN_CATEGORY } from '../lib/siteKind';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}

// --- an explicit category is authoritative -----------------------------------

check('a salon on the campaign palette is not a campaign',
  isCampaignSite({ profile: { category: 'Beauty & Wellness' }, theme: 'campaign-navy' }), false);

check('a salon on the judicial palette is not a campaign',
  isCampaignSite({ profile: { category: 'Beauty & Wellness' }, theme: 'campaign-judicial' }), false);

check('a law firm that chose navy is not a campaign',
  isCampaignSite({ profile: { category: 'Professional & Medical' }, theme: 'campaign-navy' }), false);

check('a campaign on a non-campaign palette is still a campaign',
  isCampaignSite({ profile: { category: CAMPAIGN_CATEGORY }, theme: 'luxury' }), true);

check('a campaign with no theme at all is still a campaign',
  isCampaignSite({ profile: { category: CAMPAIGN_CATEGORY } }), true);

// --- theme is the fallback, and only when nothing said ------------------------
// Sites deployed before the category field was populated identify themselves by
// palette alone. Dropping that fallback would strip a live campaign of its
// voting banner and its treasurer disclosure, which is a legal notice.

check('no category, campaign palette -> campaign',
  isCampaignSite({ profile: {}, theme: 'campaign-navy' }), true);

check('no category, judicial palette -> campaign',
  isCampaignSite({ profile: {}, theme: 'campaign-judicial' }), true);

check('empty-string category falls back to the palette',
  isCampaignSite({ profile: { category: '' }, theme: 'campaign-navy' }), true);

check('whitespace category falls back to the palette',
  isCampaignSite({ profile: { category: '   ' }, theme: 'campaign-navy' }), true);

check('no category and an ordinary palette -> not a campaign',
  isCampaignSite({ profile: {}, theme: 'luxury' }), false);

// --- degenerate input --------------------------------------------------------

check('null is not a campaign', isCampaignSite(null), false);
check('undefined is not a campaign', isCampaignSite(undefined), false);
check('an empty object is not a campaign', isCampaignSite({}), false);
check('a null profile is not a campaign', isCampaignSite({ profile: null }), false);

// --- write-in ----------------------------------------------------------------

check('a write-in badge on a campaign',
  isWriteInCampaign({ profile: { category: CAMPAIGN_CATEGORY }, badges: ['Write-In Candidate'] }), true);

check('write-in in the proof badge',
  isWriteInCampaign({ profile: { category: CAMPAIGN_CATEGORY }, proofBadgeText: 'Certified Write-In' }), true);

check('a salon with a write-in badge is not a write-in campaign',
  isWriteInCampaign({ profile: { category: 'Beauty & Wellness' }, badges: ['Write-In Candidate'] }), false);

check('a campaign with no write-in marker is not write-in',
  isWriteInCampaign({ profile: { category: CAMPAIGN_CATEGORY }, badges: ['Endorsed'] }), false);

// The legacy name check, preserved deliberately. Pinned so that removing it is
// a decision somebody makes on purpose rather than a refactor nobody noticed.
check('the legacy name fallback still identifies the live write-in campaign',
  isWriteInCampaign({ profile: { category: CAMPAIGN_CATEGORY, name: 'Waylon Rogers for Constable' } }), true);

check('but the name alone does not make a salon a write-in campaign',
  isWriteInCampaign({ profile: { category: 'Beauty & Wellness', name: 'Waylon Rogers' } }), false);

// --- a null badge entry must not throw ---------------------------------------
check('a null inside badges is survivable',
  isWriteInCampaign({ profile: { category: CAMPAIGN_CATEGORY }, badges: [null as any, 'write-in'] }), true);

if (failures) {
  console.error(`\n  smoke-sitekind: ${failures} failed\n`);
  process.exit(1);
}
console.log('  smoke-sitekind: ok');
