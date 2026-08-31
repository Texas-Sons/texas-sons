/**
 * Detects blueprint content that is still running on defaults.
 *
 * Why this exists: on 2026-08-29 a spec was generated for a real client that
 * read `undefined | N/A` for contact details, listed one service called "Core
 * Platform Solution", and carried an invented testimonial attributed to the
 * wrong city. Nothing was broken — every fallback did exactly what it was
 * written to do. The problem is that a blueprint on defaults looks finished, and
 * the only way to notice is to read it carefully.
 *
 * So the app should say so. Placeholders are fine while building; they are not
 * fine in something a client sees.
 *
 * Pure and dependency-free so it can be tested in plain Node.
 */

export type IssueSeverity = 'placeholder' | 'missing';

/**
 * What kind of wrong this is. The two fail differently and are gated
 * differently.
 *
 * 'data'  — something real is missing or still a stand-in: no phone, a stock
 *           hero, a generic tagline. Perfectly fine in a demo, which is a
 *           mockup and understood as one. Warning about it while pitching is
 *           noise, and noise is how a warning stops being read.
 *
 * 'claim' — the site asserts something about the business that nobody checked:
 *           a review count, an award, a licence, a testimonial that was
 *           invented. Never acceptable, and WORSE in a demo than on a live
 *           site — a demo goes to the owner, about her own business. She either
 *           assumes it was verified or notices it was made up, and one of those
 *           loses the job.
 */
export type IssueCategory = 'data' | 'claim';

export interface BlueprintIssue {
  field: string;
  severity: IssueSeverity;
  category: IssueCategory;
  /** What the operator should do about it. */
  message: string;
}

/**
 * Every literal a fallback can produce, from App.tsx and ClientIntakeView.
 * If a default string changes there, add it here — a placeholder the detector
 * does not know about is a placeholder that ships.
 */
const PLACEHOLDER_STRINGS = [
  // taglines / descriptions
  'proudly serving texas',
  'dedicated texas business delivering premier quality and service',
  'courtroom integrity. dedicated leadership',
  // services
  'core platform solution',
  'comprehensive execution tailored for your community and goals',
  'primary offering',
  'comprehensive premium service tailored for your specific needs',
  // testimonials
  'exceptional leadership and unmatched attention to detail',
  'exceptional service and unmatched attention to detail',
  'unmatched leadership and execution across all deliverables',
  'verified partner',
  'verified client',
  'community leader',
  // badges / proof
  'top rated · 100% guaranteed',
  '25+ years experience',
  'satisfaction guaranteed',
  'locally owned',
  'locally owned & operated',
  // contact
  '(512) 555-txsons',
  'contact@txsons.com',
  '(512) 555-0100',
  'contact@example.com',
];

function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  if (!v) return false;
  return PLACEHOLDER_STRINGS.some(p => v === p || v.includes(p));
}

/** Stock imagery that has stood in for a real photo. */
function isStockImage(url: unknown): boolean {
  return typeof url === 'string' && /images\.unsplash\.com/i.test(url);
}

/**
 * Unreachable contact details, matched by pattern rather than by name.
 *
 * The list above only catches strings someone thought to add to it, and the
 * comment at the top of this file warned exactly what that costs: a placeholder
 * the detector does not know about is a placeholder that ships. Opalescent went
 * live with `(210) 555-0142` and an address at `.example` — both invented by the
 * generator, neither on the list, both silently green.
 *
 * These two ranges are reserved by standards bodies precisely so they can never
 * belong to anyone, which makes them decidable rather than a guess:
 *   555-0100..555-0199  the NANP block set aside for fiction
 *   RFC 2606            .example / .test / .invalid / .localhost, example.com
 *
 * A phone number nobody answers and an inbox nothing reaches are worse than
 * blank fields. A blank field looks unfinished; these look finished.
 */
function isUnreachablePhone(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  return /555 ?01\d\d$/.test(digits) || /55501\d\d$/.test(digits);
}

function isUnreachableEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return /@(.+\.)?(example|test|invalid|localhost)$/.test(v)
    || /@example\.(com|net|org)$/.test(v);
}

export interface BlueprintLike {
  profile?: Record<string, any>;
  services?: Array<Record<string, any>>;
  testimonials?: Array<Record<string, any>>;
  badges?: string[];
  proofBadgeText?: string;
  [k: string]: any;
}

/**
 * Returns everything about this blueprint that a client should not see.
 * Empty array means it is built from real material.
 */
export function findBlueprintIssues(blueprint: BlueprintLike | null | undefined): BlueprintIssue[] {
  if (!blueprint) return [];
  const p = blueprint.profile || {};
  const issues: BlueprintIssue[] = [];

  if (isPlaceholder(p.tagline)) {
    issues.push({ field: 'tagline', severity: 'placeholder', category: 'data', message: 'Tagline is the generic fallback — write one in their voice.' });
  }
  if (isPlaceholder(p.description)) {
    issues.push({ field: 'description', severity: 'placeholder', category: 'data', message: 'Description is the generic fallback.' });
  }

  if (!p.heroImage) {
    issues.push({ field: 'heroImage', severity: 'missing', category: 'data', message: 'No hero image. Gather Assets, or have them upload through the intake portal.' });
  } else if (isStockImage(p.heroImage)) {
    issues.push({ field: 'heroImage', severity: 'placeholder', category: 'data', message: 'Hero is a stock photo — this is what makes every demo look alike.' });
  }

  if (!p.phone) issues.push({ field: 'phone', severity: 'missing', category: 'data', message: 'No phone number.' });
  else if (isUnreachablePhone(p.phone)) {
    issues.push({ field: 'phone', severity: 'placeholder', category: 'data', message: 'This is a 555-01xx number, reserved for fiction — nobody can call them.' });
  }
  else if (isPlaceholder(p.phone)) issues.push({ field: 'phone', severity: 'placeholder', category: 'data', message: 'Phone is a Texas Sons placeholder, not theirs.' });

  if (isUnreachableEmail(p.email)) {
    issues.push({ field: 'email', severity: 'placeholder', category: 'data', message: 'This domain is reserved and undeliverable — mail to it bounces.' });
  } else if (isPlaceholder(p.email)) {
    issues.push({ field: 'email', severity: 'placeholder', category: 'data', message: 'Email is a Texas Sons placeholder, not theirs.' });
  }

  // Gallery placeholders are legitimate while mocking a demo up — the client
  // recognises them instantly as not theirs. They are not legitimate on a live
  // site, so this warns without blocking.
  const gallery = p.galleryImages || [];
  if (gallery.length > 0 && gallery.every(isStockImage)) {
    issues.push({
      field: 'galleryImages',
      severity: 'placeholder',
      category: 'data',
      message: 'Gallery is stock photography — fine for a mockup, replace before this goes live.',
    });
  }

  const services = blueprint.services || [];
  if (services.length === 0) {
    issues.push({ field: 'services', severity: 'missing', category: 'data', message: 'No services listed.' });
  } else if (services.some(s => isPlaceholder(s?.title) || isPlaceholder(s?.description))) {
    issues.push({ field: 'services', severity: 'placeholder', category: 'data', message: 'Services are still the default filler — replace with their real menu.' });
  }

  const testimonials = blueprint.testimonials || [];
  if (testimonials.some(t => isPlaceholder(t?.quote) || isPlaceholder(t?.author))) {
    // The worst kind: a fabricated review is a claim about a real business.
    issues.push({ field: 'testimonials', severity: 'placeholder', category: 'claim', message: 'Testimonials are invented. Remove them or use real Google reviews.' });
  }

  if (isPlaceholder(blueprint.proofBadgeText)) {
    issues.push({ field: 'proofBadgeText', severity: 'placeholder', category: 'claim', message: 'Proof badge claims something they have not claimed.' });
  }
  if ((blueprint.badges || []).some(isPlaceholder)) {
    issues.push({ field: 'badges', severity: 'placeholder', category: 'claim', message: 'Badges are generic defaults.' });
  }

  return issues;
}

/** One-line summary for a status pill. Null when the blueprint is clean. */
export function summariseIssues(issues: BlueprintIssue[]): string | null {
  if (issues.length === 0) return null;
  const placeholders = issues.filter(i => i.severity === 'placeholder').length;
  const missing = issues.length - placeholders;
  const parts: string[] = [];
  if (placeholders) parts.push(`${placeholders} placeholder${placeholders === 1 ? '' : 's'}`);
  if (missing) parts.push(`${missing} missing`);
  return parts.join(' · ');
}

/**
 * Whether a prospect carries the real material a good demo needs.
 * Used to warn before converting one that has not been enriched.
 */
export function prospectHasRealAssets(prospect: any): boolean {
  if (!prospect) return false;
  const photos = Array.isArray(prospect.photos) ? prospect.photos.length : 0;
  const reviews = Array.isArray(prospect.reviews) ? prospect.reviews.length : 0;
  return photos > 0 || reviews > 0;
}

export type Engagement = 'demo' | 'commissioned';

/**
 * The issues worth showing for a given engagement.
 *
 * A demo is a mockup and understood as one, so missing data is not a problem
 * worth interrupting for. An invented claim is a problem in both, and more of
 * one in a demo: that goes to the owner, about her own business.
 */
export function issuesFor(
  blueprint: BlueprintLike | null | undefined,
  engagement: Engagement = 'demo'
): BlueprintIssue[] {
  const all = findBlueprintIssues(blueprint);
  return engagement === 'commissioned' ? all : all.filter(i => i.category === 'claim');
}

/**
 * True when this must not be published as a real client's site.
 *
 * Deliberately not a hard block anywhere — the operator can always override,
 * and a tool that refuses to do what it is told gets worked around rather than
 * heeded. This decides how loudly to say it.
 */
export function blocksCommissioning(blueprint: BlueprintLike | null | undefined): boolean {
  return findBlueprintIssues(blueprint).some(i => i.category === 'claim' || i.field === 'phone' || i.field === 'email');
}
