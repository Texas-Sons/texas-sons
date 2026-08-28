import { ClientIntake } from '../types';

/**
 * Maps a Google Places prospect into a client intake prefill.
 *
 * This exists because the previous conversion in App.tsx copied four fields
 * (businessName, email, phone, clientContact) and dropped everything else — and
 * two of those four read properties Places does not return (`phone` instead of
 * `phoneNumber`, and `email`, which Places has no concept of).
 *
 * The cost of that was every demo falling back to the same stock Unsplash hero
 * and the same invented testimonial, which is what made them all look alike.
 * `handleGatherAssets` in ProspectsView was already fetching the business's real
 * photos, real Google reviews, real hours and real phone number — and then the
 * conversion threw them away.
 *
 * Kept as a pure function so it can be tested without a browser or the Maps SDK.
 */

/** Loose shape — Places returns different field sets depending on the call. */
export interface ProspectLike {
  id?: string;
  displayName?: any;          // string in the JS SDK, but defensively handled
  formattedAddress?: string;
  websiteURI?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: any;
  googleMapsURI?: string;
  // Added by handleGatherAssets:
  phoneNumber?: string;
  openingHours?: string[];
  reviews?: Array<{ text?: any; rating?: number; author?: string }>;
  photos?: string[];
  [k: string]: any;
}

/** Places sometimes returns {text, languageCode} rather than a bare string. */
function plainText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  return '';
}

/** Best-effort vertical from the Places type. Undefined when unsure, so the form keeps its default. */
export function inferCategory(typeName?: any): ClientIntake['category'] | undefined {
  const t = plainText(typeName).toLowerCase();
  if (!t) return undefined;

  if (/restaurant|bar|cafe|coffee|bakery|food|pizza|barbecue|bbq|grill|diner|brewery|catering/.test(t)) {
    return 'Food & Beverage';
  }
  if (/salon|spa|beauty|barber|nail|hair|massage|wellness|tattoo|aesthetic/.test(t)) {
    return 'Beauty & Wellness';
  }
  if (/plumb|electric|roof|hvac|contractor|construction|landscap|lawn|pest|clean|repair|remodel|fence|concrete|mechanic|auto/.test(t)) {
    return 'Home & Trade Services';
  }
  if (/doctor|dentist|dental|clinic|medical|lawyer|attorney|law|account|insurance|real estate|chiropract|veterinar|optomet/.test(t)) {
    return 'Professional & Medical';
  }
  return undefined;
}

/**
 * Turns real Google reviews into testimonials.
 * Skips empty ones, caps quote length so cards stay readable, and marks them
 * verified because they genuinely are.
 */
export function reviewsToTestimonials(
  reviews: ProspectLike['reviews'],
  cityHint?: string
): ClientIntake['testimonials'] {
  if (!Array.isArray(reviews) || !reviews.length) return undefined;

  const mapped = reviews
    .map(r => {
      const quote = plainText(r?.text).trim();
      if (!quote) return null;
      return {
        quote: quote.length > 180 ? `${quote.slice(0, 177).trimEnd()}…` : quote,
        author: (r?.author || '').trim() || 'Google Reviewer',
        role: cityHint ? `Verified Google Review · ${cityHint}` : 'Verified Google Review',
        rating: typeof r?.rating === 'number' ? r.rating : 5,
        verified: true,
      };
    })
    .filter(Boolean) as NonNullable<ClientIntake['testimonials']>;

  // Lead with the most enthusiastic; four cards is as many as the block shows well.
  return mapped.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
}

/** "4.8★ · 127 Google Reviews" — real social proof instead of an invented badge. */
export function ratingBadge(rating?: number, count?: number): string | undefined {
  if (typeof rating !== 'number' || rating <= 0) return undefined;
  const stars = `${rating.toFixed(1)}★`;
  if (typeof count === 'number' && count > 0) {
    return `${stars} · ${count.toLocaleString()} Google Review${count === 1 ? '' : 's'}`;
  }
  return `${stars} on Google`;
}

/** City fragment of a formatted address, for testimonial attribution. */
function cityFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  // "123 Main St, Pleasanton, TX 78064, USA" -> "Pleasanton, TX"
  if (parts.length >= 3) {
    const state = parts[parts.length - 2].split(' ')[0];
    return `${parts[parts.length - 3]}, ${state}`;
  }
  return parts[0];
}

/**
 * Everything Places gave us, in the shape the intake form expects.
 * Fields we genuinely do not know are left undefined so the form's own defaults
 * apply — never filled with placeholders.
 */
export function prospectToIntakePrefill(prospect: ProspectLike): Partial<ClientIntake> {
  if (!prospect) return {};

  const businessName = plainText(prospect.displayName) || prospect.name || '';
  const address = prospect.formattedAddress || prospect.address;
  const city = cityFromAddress(address);
  const photos = Array.isArray(prospect.photos) ? prospect.photos.filter(Boolean) : [];

  const badges: string[] = [];
  const proof = ratingBadge(prospect.rating, prospect.userRatingCount);
  if (proof) badges.push(proof);
  if (city) badges.push(`Serving ${city}`);

  const prefill: Partial<ClientIntake> = {
    businessName,
    phone: prospect.phoneNumber || prospect.phone || undefined,
    address: address || undefined,
    domain: prospect.websiteURI || undefined,
    category: inferCategory(prospect.primaryTypeDisplayName),
    // weekdayDescriptions is one string per day; the intake shows a single line.
    hours: Array.isArray(prospect.openingHours) && prospect.openingHours.length
      ? prospect.openingHours.join(' · ')
      : undefined,
    // The business's actual storefront photo, not a stock image.
    heroImage: photos[0] || undefined,
    galleryImages: photos.length > 1 ? photos.slice(1) : undefined,
    testimonials: reviewsToTestimonials(prospect.reviews, city),
    badges: badges.length ? badges : undefined,
    proofBadgeText: proof,
  };

  // Strip undefined so a prefill never blanks a field the user already filled.
  return Object.fromEntries(
    Object.entries(prefill).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<ClientIntake>;
}
