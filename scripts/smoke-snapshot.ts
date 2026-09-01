/**
 * Studio edit-merge smoke test.
 *
 * The failure being pinned: an operator opens a salon whose site lists nine
 * services, asks the Studio for a darker gold, and the model returns a snapshot
 * with the colour changed and `services` simply not mentioned. Replacing the
 * project with that answer deletes her price list — the thing customers act on
 * — as a side effect of a colour change.
 *
 * So omission must mean "unchanged", while an explicit empty list must still
 * mean "cleared". Those two have to stay distinguishable or the operator loses
 * the ability to remove anything.
 */

import { mergeSnapshotEdit } from '../lib/snapshotMerge';

let failures = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (!condition) {
    failures++;
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const SNAPSHOT = {
  id: 'prj-1788000270421',
  theme: 'luxury',
  profile: {
    name: 'Opalescent Color Studio',
    tagline: 'Luxury Hair & Color Artistry',
    phone: '(210) 493-8811',
    accentColor: '#C5A059',
    logoUrl: '/clients/opalescent-logo.png',
  },
  services: [
    { title: 'Balayage', price: '$350+', bookingUrl: 'https://squareup.com/x/balayage' },
    { title: 'Colour Correction', price: '$450+' },
  ],
  badges: ['Licensed Colorist'],
  testimonials: [],
};

// --- the reported failure ---------------------------------------------------

const colourOnly = mergeSnapshotEdit(SNAPSHOT, {
  id: 'prj-1788000270421',
  theme: 'luxury',
  profile: { name: 'Opalescent Color Studio', accentColor: '#8a6d2f' },
  // services: the model said nothing at all
});
check('a colour edit keeps the service menu', colourOnly.services.length === 2,
  JSON.stringify(colourOnly.services));
check('and applies the colour', colourOnly.profile.accentColor === '#8a6d2f');
check('and keeps sibling profile fields the model dropped',
  colourOnly.profile.phone === '(210) 493-8811' && colourOnly.profile.logoUrl === '/clients/opalescent-logo.png');
check('per-service booking links survive', colourOnly.services[0].bookingUrl === 'https://squareup.com/x/balayage');

// --- removal must still be possible ----------------------------------------

const cleared = mergeSnapshotEdit(SNAPSHOT, { services: [] });
check('an explicit empty list clears', cleared.services.length === 0);
const blanked = mergeSnapshotEdit(SNAPSHOT, { profile: { phone: '' } });
check('an explicit empty string clears', blanked.profile.phone === '');
check('and clears nothing else', blanked.profile.name === 'Opalescent Color Studio');

// A model that nulls a field it was not asked about is the whole failure; only
// [] and '' remove things.
const nulled = mergeSnapshotEdit(SNAPSHOT, { services: null, badges: undefined });
check('null is treated as unsaid', nulled.services.length === 2);
check('undefined is treated as unsaid', nulled.badges.length === 1);

// --- arrays are statements about the whole list ------------------------------

const replaced = mergeSnapshotEdit(SNAPSHOT, { services: [{ title: 'Gloss', price: '$95' }] });
check('a returned list replaces rather than combines', replaced.services.length === 1,
  JSON.stringify(replaced.services));

// --- nothing is mutated ------------------------------------------------------

check('the original snapshot is untouched',
  SNAPSHOT.services.length === 2 && SNAPSHOT.profile.accentColor === '#C5A059');
check('and the result is a different object', colourOnly !== (SNAPSHOT as any));

// --- garbage in ---------------------------------------------------------------

check('a non-object edit changes nothing', mergeSnapshotEdit(SNAPSHOT, 'oops' as any) === SNAPSHOT);
check('a null edit changes nothing', mergeSnapshotEdit(SNAPSHOT, null) === SNAPSHOT);

if (failures > 0) {
  console.error(`\nSNAPSHOT SMOKE FAILED: ${failures} check(s)`);
  process.exit(1);
}
console.log('SNAPSHOT SMOKE PASS: an unmentioned field is unchanged, an empty one is cleared, and lists replace');
