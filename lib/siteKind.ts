/**
 * What kind of site this is.
 *
 * There were four definitions of "is this a campaign" and they disagreed:
 *
 *   ClientApp.tsx          category OR theme
 *   AgentBuilderStudio.tsx category OR theme
 *   SiteAuditModal.tsx     category OR theme  (only one of the two themes)
 *   BlueprintFormPanel.tsx theme ONLY
 *
 * The last one is the expensive one. The form asked the *colour scheme* what
 * business it was looking at, and DEFAULT_FORM starts every new project on
 * `campaign-navy` — so a salon was a political campaign until somebody changed
 * the palette, and while it was, `handleBuild` dropped her service menu in
 * favour of three campaign pillars. Nine services with prices and booking links
 * became three headings. That is the "services keep disappearing" bug, and it
 * would have returned the first time a law firm chose a navy theme.
 *
 * ── Why category wins but theme still gets a say ────────────────────────────
 *
 * Reading category alone is the correct rule and would have silently broken
 * live sites: a campaign deployed before the category field was populated has
 * only its theme to say what it is, and would have stopped being a campaign on
 * the next deploy — losing its voting banner, its write-in guide and its
 * treasurer disclosure, which is a legal notice.
 *
 * So an explicit category is authoritative and the palette is never consulted;
 * theme is consulted only when nothing has said what the business is. A salon
 * whose category is "Beauty & Wellness" is not a campaign no matter what colour
 * it is painted, which is the whole fix.
 */

/**
 * The fields this needs, named structurally rather than by importing
 * ProjectSnapshot — that type lives in a React component under src/, and lib/
 * is also loaded by the server, which must not pull a component into its bundle.
 */
export interface SiteKindInput {
  profile?: { category?: string | null; name?: string | null } | null;
  theme?: string | null;
  badges?: string[] | null;
  proofBadgeText?: string | null;
}

/** The one category string that means "this is a political campaign". */
export const CAMPAIGN_CATEGORY = 'Campaign & Leadership';

/** Themes that used to stand in for the category, kept only as a fallback. */
const CAMPAIGN_THEMES = new Set(['campaign-navy', 'campaign-judicial']);

export function isCampaignSite(site: SiteKindInput | null | undefined): boolean {
  if (!site) return false;

  const category = String(site.profile?.category ?? '').trim();

  // Somebody said what this business is. Believe them, and do not look at the
  // colours — this is the branch that stops a navy salon being a campaign.
  if (category) return category === CAMPAIGN_CATEGORY;

  // Nothing said. Fall back to the palette, which is how every site built
  // before the category field was populated identifies itself.
  return CAMPAIGN_THEMES.has(String(site.theme ?? ''));
}

/**
 * A write-in campaign, which gets an extra section explaining how to write a
 * name onto a ballot.
 *
 * Duplicated verbatim in ClientApp and AgentBuilderStudio before this, down to
 * a hardcoded check for one candidate's first name. That name check is
 * preserved rather than removed: it is load-bearing for a live site whose
 * badges may not carry the phrase, and dropping it would quietly remove voting
 * instructions from a real campaign. It should go once that site records the
 * fact properly — it is a client-specific string in shared code, and any future
 * client with the same first name inherits a voting guide.
 */
export function isWriteInCampaign(site: SiteKindInput | null | undefined): boolean {
  if (!isCampaignSite(site)) return false;

  const proof = String(site!.proofBadgeText ?? '').toLowerCase();
  if (proof.includes('write-in')) return true;

  if (site!.badges?.some(b => String(b ?? '').toLowerCase().includes('write-in'))) return true;

  // Legacy, see above.
  return String(site!.profile?.name ?? '').toLowerCase().includes('waylon');
}
