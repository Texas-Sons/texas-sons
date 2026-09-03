/**
 * Every field the client fills in must be read by something.
 *
 * The intake portal asks the client for information and posts it as one opaque
 * jsonb blob. Nothing about that arrangement forces anyone to read it back, and
 * twice now something has been collected and silently ignored:
 *
 *   socialLinks   a free-text box labelled "Facebook, Instagram, etc.",
 *                 written to the payload and read by nothing at all. Three
 *                 references in the codebase, all inside the form itself. The
 *                 operator retyped every client's Instagram by hand instead.
 *
 *   photos[1..]   the merge took photos[0] as the hero and dropped the rest, so
 *                 a client who uploaded eight got one on her site and no sign
 *                 the other seven had gone anywhere.
 *
 * Both are the same fault: the form and the code that consumes it are two
 * hand-kept lists, and nothing compared them. This compares them.
 *
 * It is a source-level check, like the route-gate assertions in
 * smoke-security.ts, because the merge is inline JSX inside a component and
 * cannot be imported. Coarse, but it fails the moment a field is added to the
 * form and forgotten in the merge — which is the whole failure mode.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

let failures = 0;
function fail(msg: string) { failures++; console.error(`  FAIL  ${msg}`); }

const portal = readFileSync(
  join(process.cwd(), 'src', 'components', 'IntakePortal', 'IntakePortal.tsx'), 'utf8');
const view = readFileSync(
  join(process.cwd(), 'src', 'components', 'ClientIntake', 'ClientIntakeView.tsx'), 'utf8');

// --- what the client is asked for -------------------------------------------

const block = portal.match(/const payload = \{([\s\S]*?)\n\s*\};/);
if (!block) {
  fail('could not find the payload object in IntakePortal.tsx — has it been renamed?');
} else {
  const keys = block[1]
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => (l.match(/^([A-Za-z0-9_]+)\s*[,:]/) || [])[1])
    .filter((k): k is string => !!k);

  if (keys.length < 8) {
    fail(`only ${keys.length} payload keys parsed — the extractor has probably broken rather than the form shrinking`);
  }

  /**
   * Fields the merge deliberately does not carry across verbatim, each with the
   * reason. Adding a name here is a decision; leaving one out is the bug.
   */
  const handledDifferently: Record<string, string> = {
    // Read as payload.logoBase64 and written to logoUrl — a base64 upload and a
    // stored URL are not the same field.
    logoBase64: 'mapped onto logoUrl',
    // Read via a local `submitted` array so the hero and the gallery can be
    // split apart; photos[0] leads, the rest go to galleryImages.
    photos: 'split between heroImage and galleryImages',
  };

  for (const key of keys) {
    if (handledDifferently[key]) {
      // Still has to be referenced somewhere, just not as payload.<key> directly.
      if (!view.includes(key)) {
        fail(`"${key}" is collected by the intake form and appears nowhere in ClientIntakeView (expected: ${handledDifferently[key]})`);
      }
      continue;
    }
    if (!view.includes(`payload.${key}`)) {
      fail(
        `"${key}" is collected by the intake form and never read.\n` +
        '        Add it to the "Merge & Apply to Intake Record" list in\n' +
        '        ClientIntakeView.tsx, or record why it is skipped in\n' +
        '        handledDifferently in this file.'
      );
    }
  }
}

// --- the specific regressions, named ----------------------------------------

// Matches the state binding, not the bare word: the comment in IntakePortal
// explaining why this field was removed names it, and tripping on that comment
// would make this check impossible to keep green honestly.
if (/setSocialLinks|\bsocialLinks\s*[,:]/.test(portal) && !view.includes('payload.socialLinks')) {
  fail('the socialLinks free-text box is back in the intake form and still unread — it was replaced by instagramUrl, giftCardUrl and bookingUrl for exactly this reason');
}

if (!/galleryImages/.test(view)) {
  fail('ClientIntakeView no longer carries galleryImages — every client photo past the first is being dropped again');
}

// The scanner passes three arguments; a two-parameter handler silently discards
// the third, which is every photo it found beyond the hero.
const scannerArity = view.match(/const handleApplyFromScanner = \(([\s\S]*?)\)\s*=>/);
if (!scannerArity) {
  fail('handleApplyFromScanner not found in ClientIntakeView.tsx');
} else if (!/allImages/.test(scannerArity[1])) {
  fail('handleApplyFromScanner does not take allImages, so scanned photos past the hero are discarded (PhotoScannerModal.tsx passes three arguments)');
}

if (failures) {
  console.error(`\n  smoke-intake: ${failures} failed\n`);
  process.exit(1);
}
console.log('  smoke-intake: ok — every field the client fills in is read by the merge');
