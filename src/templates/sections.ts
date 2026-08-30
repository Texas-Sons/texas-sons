/**
 * Site composition as data.
 *
 * ClientApp used to hardcode one JSX tree, so every non-campaign site was
 * Navbar → Hero → Services → Testimonials → Booking → Footer regardless of what
 * the business actually was. Colours and copy varied; structure never did, which
 * is what made demos read as "the same template again".
 *
 * A blueprint can now carry `sections: SiteSection[]`. When it does not — which
 * is true of every site already deployed — `resolveSections` falls back to an
 * archetype. The campaign and generic archetypes reproduce the previous order
 * exactly, so existing live sites render byte-for-byte as before.
 */

export type SectionKind =
  | 'navbar'
  | 'hero'
  | 'campaignHero'
  | 'writeInGuide'
  | 'votingBanner'
  | 'services'
  | 'events'
  | 'gallery'
  | 'beforeAfter'
  | 'products'
  | 'testimonials'
  | 'squareBooking'
  | 'booking'
  | 'footer';

export interface SiteSection {
  kind: SectionKind;
  /** Per-section copy and options, merged over the block's own defaults. */
  props?: Record<string, any>;
}

export interface ArchetypeInput {
  category?: string;
  isCampaign: boolean;
  isWriteIn: boolean;
  officeTitle?: string;
}

/**
 * Campaign layout. Order preserved exactly from the previous hardcoded tree:
 * navbar → hero → [write-in guide] → voting banner → platform → events →
 * endorsements → volunteer → footer.
 */
function campaignArchetype(input: ArchetypeInput): SiteSection[] {
  return [
    {
      kind: 'navbar',
      props: {
        ctaText: input.isWriteIn ? 'Vote Write-In' : 'Join The Campaign',
        navItems: [
          ...(input.isWriteIn ? [{ label: 'How to Vote Write-In', href: '#write-in-guide' }] : []),
          { label: 'Platform', href: '#services' },
          { label: 'Events', href: '#events' },
          { label: 'Endorsements', href: '#reviews' },
          { label: 'Voting Info', href: '#voting' },
          { label: 'Volunteer', href: '#contact' },
        ],
      },
    },
    {
      kind: 'campaignHero',
      props: {
        ctaText: input.isWriteIn ? 'How to Vote Write-In' : 'Join The Campaign',
        secondaryCtaText: 'Read Our Platform',
      },
    },
    ...(input.isWriteIn ? [{ kind: 'writeInGuide' as const }] : []),
    { kind: 'votingBanner' },
    {
      kind: 'services',
      props: {
        title: 'Campaign Platform & Priorities',
        subtitle: 'Our commitment to the community and our plan for the future.',
      },
    },
    { kind: 'events' },
    {
      kind: 'testimonials',
      props: {
        title: 'Endorsements & Community Support',
        subtitle: 'Trusted by leaders, law enforcement, and families across Texas.',
      },
    },
    {
      kind: 'booking',
      props: {
        title: 'Volunteer & Request Yard Signs',
        subtitle: 'Join today.',
      },
    },
    { kind: 'footer' },
  ];
}

/**
 * Food & beverage. Menu comes before proof — someone deciding where to eat wants
 * to see the food first, and reviews only matter once they are tempted.
 */
function foodArchetype(): SiteSection[] {
  return [
    { kind: 'navbar', props: { ctaText: 'View Menu' } },
    {
      kind: 'hero',
      props: { ctaText: 'View Menu', secondaryCtaText: 'Catering Options' },
    },
    {
      kind: 'gallery',
      props: { title: 'The Food', subtitle: 'Straight from the pit.' },
    },
    {
      kind: 'services',
      props: { title: 'The Menu', subtitle: 'Made fresh, served generously.' },
    },
    {
      kind: 'products',
      props: { title: 'Take Some Home', subtitle: 'Sauces, rubs and merch.' },
    },
    {
      kind: 'testimonials',
      props: { title: 'What Locals Are Saying', subtitle: 'Real reviews from people who eat here.' },
    },
    {
      kind: 'booking',
      props: { title: 'Reserve a Table or Order Catering', subtitle: 'Tell us what you need and we will get right back to you.' },
    },
    { kind: 'footer' },
  ];
}

/**
 * Home & trade services. Contact sits directly under the hero: a burst pipe is
 * an emergency, and nobody scrolls past three sections to find a phone number.
 */
function tradesArchetype(): SiteSection[] {
  return [
    { kind: 'navbar', props: { ctaText: 'Get a Free Estimate' } },
    {
      kind: 'hero',
      props: { ctaText: 'Get a Free Estimate', secondaryCtaText: 'View Services' },
    },
    {
      kind: 'booking',
      props: { title: 'Request Service', subtitle: 'Fast response. Upfront pricing. No surprises.' },
    },
    {
      kind: 'services',
      props: { title: 'What We Do', subtitle: 'Upfront pricing on every job.' },
    },
    {
      kind: 'gallery',
      props: { title: 'Recent Jobs', subtitle: 'Work we have finished nearby.' },
    },
    {
      kind: 'testimonials',
      props: { title: 'Trusted by Your Neighbours', subtitle: 'Verified reviews from customers nearby.' },
    },
    { kind: 'footer' },
  ];
}

/** Beauty & wellness. Booking-led, with the service menu and its pricing high up. */
function beautyArchetype(): SiteSection[] {
  return [
    {
      kind: 'navbar',
      props: {
        ctaText: 'Book Appointment',
        navItems: [
          { label: 'Portfolio', href: '#portfolio' },
          { label: 'Services', href: '#services-page' },
          { label: 'Shop', href: '#products' },
          { label: 'Visit', href: '#contact' },
        ],
      },
    },
    {
      kind: 'hero',
      props: { ctaText: 'Book Appointment', secondaryCtaText: 'See Services' },
    },
    {
      kind: 'beforeAfter',
      props: { title: 'The Transformation', subtitle: 'Drag to reveal.' },
    },
    {
      kind: 'services',
      props: { title: 'Services & Pricing', subtitle: 'Everything we offer, with no hidden costs.' },
    },
    {
      kind: 'gallery',
      props: { title: 'Our Work', subtitle: 'Recent results from the chair.' },
    },
    {
      kind: 'products',
      props: { title: 'Shop the Studio', subtitle: 'Take the salon home with you.' },
    },
    {
      kind: 'squareBooking',
      props: { title: 'Book Your Appointment', subtitle: 'Schedule your next visit.' },
    },
    {
      kind: 'booking',
      props: { title: 'Book Your Visit', subtitle: 'Pick a service and we will confirm your time.' },
    },
    {
      kind: 'testimonials',
      props: { title: 'Client Results', subtitle: 'Verified reviews from regulars.' },
    },
    { kind: 'footer' },
  ];
}

/** Professional & medical. Credibility first: who we are, then proof, then contact. */
function professionalArchetype(): SiteSection[] {
  return [
    { kind: 'navbar', props: { ctaText: 'Request a Consultation' } },
    {
      kind: 'hero',
      props: { ctaText: 'Request a Consultation', secondaryCtaText: 'Our Practice Areas' },
    },
    {
      kind: 'services',
      props: { title: 'Practice Areas', subtitle: 'Focused expertise, clearly explained.' },
    },
    {
      kind: 'testimonials',
      props: { title: 'Client Outcomes', subtitle: 'What people say after working with us.' },
    },
    {
      kind: 'booking',
      props: { title: 'Request a Consultation', subtitle: 'Confidential, no obligation.' },
    },
    { kind: 'footer' },
  ];
}

/**
 * The previous hardcoded order, kept verbatim as the fallback for anything
 * uncategorised so existing deployed sites are unaffected.
 */
function genericArchetype(): SiteSection[] {
  return [
    { kind: 'navbar', props: { ctaText: 'Book Free Estimate' } },
    {
      kind: 'hero',
      props: { ctaText: 'Book Free Estimate', secondaryCtaText: 'View Services' },
    },
    {
      kind: 'services',
      props: { title: 'Our Services', subtitle: 'Professional, reliable, and tailored to your needs.' },
    },
    {
      kind: 'testimonials',
      props: { title: 'What Our Clients Say', subtitle: 'Real reviews from verified customers in your area.' },
    },
    {
      kind: 'booking',
      props: { title: 'Request a Free Consultation', subtitle: 'Get in touch with us.' },
    },
    { kind: 'footer' },
  ];
}

/** Picks a layout for a business that has not been given an explicit one. */
export function defaultArchetype(input: ArchetypeInput): SiteSection[] {
  if (input.isCampaign) return campaignArchetype(input);

  switch (input.category) {
    case 'Food & Beverage':        return foodArchetype();
    case 'Home & Trade Services':  return tradesArchetype();
    case 'Beauty & Wellness':      return beautyArchetype();
    case 'Professional & Medical': return professionalArchetype();
    default:                       return genericArchetype();
  }
}

/**
 * An explicit `sections` array on the blueprint wins; otherwise fall back to the
 * archetype. Every site deployed before this existed takes the fallback path.
 */
export function resolveSections(
  sections: SiteSection[] | undefined,
  input: ArchetypeInput
): SiteSection[] {
  if (Array.isArray(sections) && sections.length > 0) return sections;
  return defaultArchetype(input);
}

/** Human-readable archetype name, for the Studio's layout picker. */
export const ARCHETYPE_LABELS: Record<string, string> = {
  'Food & Beverage': 'Menu-led',
  'Home & Trade Services': 'Emergency-led',
  'Beauty & Wellness': 'Booking-led',
  'Professional & Medical': 'Credibility-led',
  campaign: 'Campaign',
  generic: 'Standard',
};
