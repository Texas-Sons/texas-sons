/**
 * Regression tests for prospectToIntakePrefill.
 *
 * The conversion this replaces silently dropped every enriched field — real
 * photos, real Google reviews, real hours — while appearing to work, because it
 * copied four properties and two of them did not exist on a Places result. Every
 * demo then fell back to the same stock hero and the same invented testimonial.
 *
 * Silent data loss in a mapping is invisible until someone notices the output
 * looks generic, so it gets tests.
 */

import {
  prospectToIntakePrefill,
  reviewsToTestimonials,
  ratingBadge,
  inferCategory,
} from '../src/utils/prospectToIntake';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}

function checkTrue(label: string, actual: boolean) {
  if (!actual) {
    failures++;
    console.error(`  FAIL  ${label}`);
  }
}

// A prospect after handleGatherAssets has enriched it.
const enriched = {
  id: 'ChIJexample',
  displayName: 'Post Oak Smokehouse',
  formattedAddress: '123 Main St, Pleasanton, TX 78064, USA',
  rating: 4.8,
  userRatingCount: 127,
  primaryTypeDisplayName: 'Barbecue Restaurant',
  phoneNumber: '(830) 555-0142',
  openingHours: ['Monday: 11 AM–8 PM', 'Tuesday: 11 AM–8 PM'],
  photos: ['https://places/photo1.jpg', 'https://places/photo2.jpg', 'https://places/photo3.jpg'],
  reviews: [
    { text: 'Best brisket in Atascosa County, hands down.', rating: 5, author: 'Dana R.' },
    { text: 'Great service and the ribs are worth the drive.', rating: 4, author: 'Miguel S.' },
  ],
};

const out = prospectToIntakePrefill(enriched);

// --- the fields that used to be dropped ------------------------------------

check('business name', out.businessName, 'Post Oak Smokehouse');
check('phone comes from phoneNumber, not phone', out.phone, '(830) 555-0142');
check('address', out.address, '123 Main St, Pleasanton, TX 78064, USA');
check('hours joined from weekday descriptions', out.hours, 'Monday: 11 AM–8 PM · Tuesday: 11 AM–8 PM');
check('hero image is their real first photo', out.heroImage, 'https://places/photo1.jpg');
check('remaining photos kept as gallery', out.galleryImages, ['https://places/photo2.jpg', 'https://places/photo3.jpg']);
check('category inferred from Places type', out.category, 'Food & Beverage');
check('proof badge from real rating', out.proofBadgeText, '4.8★ · 127 Google Reviews');

// Testimonials must be the real reviews, not invented ones.
check('two testimonials from two reviews', out.testimonials?.length, 2);
check('highest rating leads', out.testimonials?.[0].author, 'Dana R.');
check('real quote text', out.testimonials?.[0].quote, 'Best brisket in Atascosa County, hands down.');
check('marked verified', out.testimonials?.[0].verified, true);
checkTrue('attribution mentions the city', !!out.testimonials?.[0].role?.includes('Pleasanton'));

// --- defensive shapes -------------------------------------------------------

check('displayName as {text} object', prospectToIntakePrefill({ displayName: { text: 'Acme Co' } }).businessName, 'Acme Co');
check('review text as {text} object',
  reviewsToTestimonials([{ text: { text: 'Solid work' }, rating: 5, author: 'Pat' }])?.[0].quote,
  'Solid work');
check('empty prospect does not throw', prospectToIntakePrefill({} as any), {});
check('null prospect does not throw', prospectToIntakePrefill(null as any), {});
check('no reviews yields undefined, not an empty array', reviewsToTestimonials([]), undefined);
check('blank review text is skipped', reviewsToTestimonials([{ text: '   ', rating: 5, author: 'X' }]), []);

// Unknown fields must be absent entirely — a prefill must never blank a field
// the user already filled in.
const sparse = prospectToIntakePrefill({ displayName: 'Just A Name' });
check('sparse prefill omits unknown phone', 'phone' in sparse, false);
check('sparse prefill omits unknown heroImage', 'heroImage' in sparse, false);
check('sparse prefill omits unknown testimonials', 'testimonials' in sparse, false);

// --- helpers ----------------------------------------------------------------

check('long quotes are truncated', (reviewsToTestimonials([
  { text: 'x'.repeat(300), rating: 5, author: 'A' },
])?.[0].quote || '').length <= 180, true);

check('rating badge without count', ratingBadge(4.5), '4.5★ on Google');
check('rating badge singular review', ratingBadge(5, 1), '5.0★ · 1 Google Review');
check('no badge without a rating', ratingBadge(undefined, 10), undefined);

check('salon -> Beauty & Wellness', inferCategory('Hair Salon'), 'Beauty & Wellness');
check('plumber -> Home & Trade Services', inferCategory('Plumber'), 'Home & Trade Services');
check('attorney -> Professional & Medical', inferCategory('Law Firm'), 'Professional & Medical');
check('unknown type stays undefined so the form default applies', inferCategory('Miscellaneous Thing'), undefined);

// --- Result -----------------------------------------------------------------

if (failures > 0) {
  console.error(`\nMAPPING SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('MAPPING SMOKE PASS: prospect -> intake carries photos, reviews, hours, phone and rating');
