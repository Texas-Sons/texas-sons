/**
 * Tests for the client-media merge.
 *
 * This decides what actually reaches a client's live site, so the precedence
 * rules need to be pinned. The one that matters most: a stock placeholder must
 * never survive once she has uploaded real work — that is the whole point of
 * giving her a portal.
 */

import { mergeClientMedia, type ClientMediaRow } from '../lib/clientMedia';

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

let n = 0;
const row = (kind: any, data: any, sort = 0): ClientMediaRow =>
  ({ id: `m${++n}`, kind, data, sort_order: sort });

const STOCK = 'https://images.unsplash.com/photo-123?auto=format';
const REAL = 'https://cdn.example/her-work-1.jpg';

// --- portfolio ---------------------------------------------------------------

const base = { profile: { name: 'Opalescent', heroImage: STOCK, galleryImages: [STOCK, STOCK] } };
const r1 = mergeClientMedia(base, [
  row('portfolio', { url: REAL }, 0),
  row('portfolio', { url: 'https://cdn.example/2.jpg' }, 1),
]);

check('her photos replace a wholly stock gallery', r1.blueprint.profile.galleryImages, [REAL, 'https://cdn.example/2.jpg']);

// The incident of 2026-08-31, pinned.
//
// This used to assign the uploaded array over the whole gallery, so a client
// uploading her first photo replaced a curated five-image gallery with one
// image. On a live salon site that read, correctly, as the site being wiped.
// Uploading a photo adds a photo.
{
  const curated = {
    profile: {
      name: 'Opalescent',
      heroImage: 'https://cdn.example/operator-hero.jpg',
      galleryImages: [
        'https://cdn.example/curated-1.jpg',
        STOCK,
        'https://cdn.example/curated-2.jpg',
      ],
    },
  };
  const after = mergeClientMedia(curated, [row('portfolio', { url: REAL }, 0)]);
  const gallery = after.blueprint.profile.galleryImages;

  check('one upload does not wipe a curated gallery', gallery.length, 3);
  check('her photo leads the gallery', gallery[0], REAL);
  check('operator-chosen images survive', gallery.includes('https://cdn.example/curated-1.jpg'), true);
  check('stock images still lose', gallery.includes(STOCK), false);
  check('a deliberate hero is untouched', after.blueprint.profile.heroImage, 'https://cdn.example/operator-hero.jpg');
}

// Re-uploading the same file must not double it up.
{
  const dupes = mergeClientMedia(
    { profile: { galleryImages: [REAL, 'https://cdn.example/curated.jpg'] } },
    [row('portfolio', { url: REAL }, 0)]
  );
  check('duplicates are collapsed', dupes.blueprint.profile.galleryImages, [REAL, 'https://cdn.example/curated.jpg']);
}
check('a stock hero is replaced by her first real photo', r1.blueprint.profile.heroImage, REAL);
check('applied counts are reported', r1.applied.portfolio, 2);

// A hero the operator deliberately chose is not a placeholder and must survive.
const chosen = mergeClientMedia(
  { profile: { heroImage: 'https://places.googleapis.com/v1/photo/x' } },
  [row('portfolio', { url: REAL })]
);
check('a real chosen hero is left alone', chosen.blueprint.profile.heroImage, 'https://places.googleapis.com/v1/photo/x');

// No hero at all — take hers.
const noHero = mergeClientMedia({ profile: {} }, [row('portfolio', { url: REAL })]);
check('an absent hero is filled from her portfolio', noHero.blueprint.profile.heroImage, REAL);

// Half-finished uploads are not photos.
const partial = mergeClientMedia({ profile: {} }, [
  row('portfolio', { url: REAL }),
  row('portfolio', {}),
  row('portfolio', { url: '' }),
]);
check('rows without a url are skipped', partial.blueprint.profile.galleryImages, [REAL]);

// --- before / after ----------------------------------------------------------

const pairs = mergeClientMedia({ profile: {} }, [
  row('beforeAfter', { before: 'b1', after: 'a1', label: 'Balayage' }),
  row('beforeAfter', { before: 'b2' }),               // incomplete
  row('beforeAfter', { after: 'a3' }),                // incomplete
]);
check('only complete pairs survive', pairs.blueprint.beforeAfter.length, 1);
check('pair fields carry through', pairs.blueprint.beforeAfter[0].label, 'Balayage');

// --- products ----------------------------------------------------------------

const prods = mergeClientMedia({ profile: {}, products: [{ name: 'Demo Item' }] }, [
  row('product', { name: 'Bond Repair', price: '$48', featured: true }),
  row('product', { price: '$10' }),                   // no name
]);
check('her products replace demo ones', prods.blueprint.products.length, 1);
check('and keep their fields', prods.blueprint.products[0].name, 'Bond Repair');
check('featured is coerced to a boolean', prods.blueprint.products[0].featured, true);

// --- non-destructive ---------------------------------------------------------

const original = { profile: { name: 'Keep', heroImage: STOCK }, services: [{ title: 'Balayage' }] };
const snapshot = JSON.stringify(original);
const out = mergeClientMedia(original, [row('portfolio', { url: REAL })]);
check('the input blueprint is never mutated', JSON.stringify(original), snapshot);
check('operator-owned fields are untouched', out.blueprint.services, [{ title: 'Balayage' }]);
check('the business name survives', out.blueprint.profile.name, 'Keep');

// --- empty -------------------------------------------------------------------

const none = mergeClientMedia(base, []);
check('no media leaves the blueprint as it was', none.blueprint.profile.galleryImages, [STOCK, STOCK]);
check('and reports nothing applied', none.applied, { portfolio: 0, beforeAfter: 0, product: 0 });
checkTrue('a null blueprint does not throw', !!mergeClientMedia(null, [row('portfolio', { url: REAL })]).blueprint);

if (failures > 0) {
  console.error(`\nMEDIA SMOKE FAIL: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('MEDIA SMOKE PASS: client media overrides placeholders, never operator-chosen content, and never mutates the input');
