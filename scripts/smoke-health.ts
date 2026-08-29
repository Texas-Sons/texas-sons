/**
 * Tests for the placeholder detector.
 *
 * The detector's whole job is noticing content that looks finished but is not.
 * If a default string changes in App.tsx or ClientIntakeView and this list is
 * not updated, the detector goes quiet and placeholders ship — so the fixtures
 * below are copied verbatim from those files.
 */

import {
  findBlueprintIssues,
  summariseIssues,
  prospectHasRealAssets,
} from '../src/utils/blueprintHealth';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.error(`  FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label: string, actual: boolean) {
  if (!actual) { failures++; console.error(`  FAIL  ${label}`); }
}

const fields = (b: any) => findBlueprintIssues(b).map(i => i.field).sort();

// --- the exact blueprint that prompted this ---------------------------------
// Reconstructed from the Opalescent spec generated on 2026-08-29.

const generatedSpec = {
  profile: {
    name: 'Opalescent Color Studio',
    tagline: 'Opalescent Color Studio — Proudly Serving Texas',
    description: 'Dedicated Texas business delivering premier quality and service.',
    heroImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format',
  },
  services: [
    { title: 'Core Platform Solution', description: 'Comprehensive execution tailored for your community and goals.' },
  ],
  testimonials: [
    { quote: 'Unmatched leadership and execution across all deliverables.', author: 'Client Partner' },
  ],
  badges: ['25+ Years Experience', 'Satisfaction Guaranteed'],
  proofBadgeText: 'Top Rated · 100% Guaranteed',
};

const found = fields(generatedSpec);
for (const f of ['tagline', 'description', 'heroImage', 'services', 'testimonials', 'badges', 'proofBadgeText', 'phone']) {
  checkTrue(`flags ${f} in the generated spec`, found.includes(f));
}

// --- the real blueprint must come back clean --------------------------------

const realBlueprint = {
  profile: {
    name: 'Opalescent Color Studio',
    tagline: 'Luxury Hair & Color Artistry',
    description: "San Antonio's destination for high-end hair transformations.",
    heroImage: 'https://places.googleapis.com/v1/photo/abc',
    phone: '(210) 555-0142',
    email: 'hello@opalescent.example',
  },
  services: [
    { title: 'Balayage', description: 'Full head · 180 min', price: '$350+' },
    { title: 'Hand-Tied Extensions', description: 'Installation', price: '$250/row' },
  ],
  testimonials: [
    { quote: 'Best balayage in San Antonio.', author: 'Dana R.' },
  ],
  badges: ['Babe Hair Extension Specialist'],
};
check('a real blueprint has no issues', findBlueprintIssues(realBlueprint), []);
check('and summarises to null', summariseIssues(findBlueprintIssues(realBlueprint)), null);

// --- individual detections --------------------------------------------------

checkTrue('stock unsplash hero is flagged',
  fields({ profile: { heroImage: 'https://images.unsplash.com/photo-123' } }).includes('heroImage'));
checkTrue('a real Places photo is not flagged',
  !fields({ profile: { heroImage: 'https://places.googleapis.com/v1/photo/x', phone: '1' } }).includes('heroImage'));
checkTrue('missing hero is flagged as well as a stock one',
  fields({ profile: {} }).includes('heroImage'));

checkTrue('the Texas Sons placeholder phone is flagged',
  fields({ profile: { phone: '(512) 555-TXSONS' } }).includes('phone'));
checkTrue('the Texas Sons placeholder email is flagged',
  fields({ profile: { email: 'contact@txsons.com', phone: '1' } }).includes('email'));

checkTrue('the ClientIntakeView service default is flagged',
  fields({ services: [{ title: 'Primary Offering', description: 'Comprehensive premium service tailored for your specific needs.' }] }).includes('services'));
checkTrue('an invented "Verified Client" testimonial is flagged',
  fields({ testimonials: [{ quote: 'Great', author: 'Verified Client' }] }).includes('testimonials'));
checkTrue('an empty testimonial list is NOT flagged — omitting is correct',
  !fields({ testimonials: [], profile: { phone: '1', heroImage: 'x' }, services: [{ title: 'Cut' }] }).includes('testimonials'));

checkTrue('an all-stock gallery is flagged',
  fields({ profile: { galleryImages: ['https://images.unsplash.com/photo-1', 'https://images.unsplash.com/photo-2'] } }).includes('galleryImages'));
checkTrue('a gallery of real photos is not flagged',
  !fields({ profile: { galleryImages: ['https://places.googleapis.com/v1/photo/a'], phone: '1', heroImage: 'x' } }).includes('galleryImages'));
checkTrue('an empty gallery is not flagged — absence is not a placeholder',
  !fields({ profile: { galleryImages: [], phone: '1', heroImage: 'x' } }).includes('galleryImages'));

check('null blueprint yields no issues rather than throwing', findBlueprintIssues(null), []);

// --- the summary line -------------------------------------------------------

const summary = summariseIssues(findBlueprintIssues(generatedSpec));
checkTrue('summary mentions placeholders', !!summary && summary.includes('placeholder'));
checkTrue('summary mentions missing', !!summary && summary.includes('missing'));

// --- prospect asset check ---------------------------------------------------

check('a bare prospect has no real assets', prospectHasRealAssets({ displayName: 'X' }), false);
check('photos count as real assets', prospectHasRealAssets({ photos: ['a'] }), true);
check('reviews count as real assets', prospectHasRealAssets({ reviews: [{ text: 'hi' }] }), true);
check('empty arrays do not count', prospectHasRealAssets({ photos: [], reviews: [] }), false);
check('null prospect is safe', prospectHasRealAssets(null), false);

// --- Result -----------------------------------------------------------------

if (failures > 0) {
  console.error(`\nHEALTH SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('HEALTH SMOKE PASS: placeholder content is detected; real content is not falsely flagged');
