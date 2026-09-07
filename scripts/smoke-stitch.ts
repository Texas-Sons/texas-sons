/**
 * Tests for the Stitch mapping.
 *
 * The fixtures are not invented. They are six real design systems pulled from
 * Stitch — five from the live project, one captured from a generate call — and
 * they are in the repo because the failure this guards against is only visible
 * across several of them at once.
 *
 * The failure: Stitch's colour slots are not positionally stable.
 * `overrideNeutralColor` is #f2f2f2, a light ground, in Lone Star Modernist and
 * #2d241e, dark ink, in Terra & Silk. Any mapping that reads a fixed slot as
 * "the background" is correct on one and inverts the other — publishing a cream
 * salon on near-black. That is the same class of bug as the theme being stored
 * in two places, and it would arrive the same way: silently, on a client's
 * live page.
 *
 * So the properties pinned here are about polarity and readability, not about
 * particular hex values. A future Stitch that renames every field should still
 * pass, or fail loudly.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { seedsFromTheme, pairingFor, variantFromResponse } from '../lib/stitch';
import { buildThemeVars, luminance, contrast, FONT_PAIRINGS } from '../src/templates/blocks/theme';

let failures = 0;
function fail(msg: string) {
  failures++;
  console.error(`  FAIL  ${msg}`);
}
function check(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) fail(`${label}\n        expected ${expected}\n        got      ${actual}`);
}

const fixtures: Record<string, { displayName: string; theme: any }> = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'fixtures', 'stitch-themes.json'), 'utf8'),
);
const names = Object.keys(fixtures);
if (names.length < 6) fail(`expected at least 6 fixtures, found ${names.length}`);

// --- 1. polarity is never inverted -------------------------------------------

for (const key of names) {
  const { displayName, theme } = fixtures[key];
  const seeds = seedsFromTheme(theme);
  const wantDark = String(theme.colorMode).toUpperCase() === 'DARK';
  const gotDark = luminance(seeds.primaryColor) < 0.18;
  if (gotDark !== wantDark) {
    fail(
      `${displayName}: colorMode is ${theme.colorMode} but the ground came out ` +
        `${seeds.primaryColor} (luminance ${luminance(seeds.primaryColor).toFixed(3)})`,
    );
  }
}

// The specific pair that makes the slot unreliable. Stated as values because
// this is the regression, and a mapping that "passes" by reading neutral would
// get exactly these two wrong in opposite directions.
check('Terra & Silk ground is the surface, not the dark neutral',
  seedsFromTheme(fixtures['terra-and-silk'].theme).primaryColor, '#fff8f5');
check('Lone Star Modernist ground is the surface',
  seedsFromTheme(fixtures['lone-star-modernist'].theme).primaryColor, '#f9f9f9');
check('Obsidian Forge stays dark',
  seedsFromTheme(fixtures['obsidian-forge'].theme).primaryColor, '#131313');

// --- 2. the accent is visible on the ground it was chosen for ----------------

for (const key of names) {
  const { displayName, theme } = fixtures[key];
  const seeds = seedsFromTheme(theme);
  const r = contrast(seeds.accentColor, seeds.primaryColor);
  if (r < 1.6) {
    fail(`${displayName}: accent ${seeds.accentColor} on ground ${seeds.primaryColor} is only ${r.toFixed(2)}:1`);
  }
}

// --- 3. the seeds survive our own derivation ---------------------------------
// This is the property that justifies taking four values instead of Stitch's
// whole palette: whatever it invents, the page it produces stays readable,
// because buildThemeVars measures rather than trusts.

for (const key of names) {
  const { displayName, theme } = fixtures[key];
  const seeds = seedsFromTheme(theme);
  const v = buildThemeVars({
    theme: 'custom',
    primaryColor: seeds.primaryColor,
    accentColor: seeds.accentColor,
    fontFamily: seeds.fontFamily,
  });

  check(`${displayName}: the ground is used as the background`, v['--ts-bg'], seeds.primaryColor);

  const textRatio = contrast(v['--ts-text'], v['--ts-bg']);
  if (textRatio < 7) fail(`${displayName}: body text is only ${textRatio.toFixed(1)}:1 on its own ground`);

  const mutedRatio = contrast(v['--ts-muted'], v['--ts-bg']);
  if (mutedRatio < 4.5) fail(`${displayName}: muted text is only ${mutedRatio.toFixed(1)}:1`);

  const buttonRatio = contrast(v['--ts-accent-contrast'], v['--ts-accent']);
  if (buttonRatio < 4.5) {
    fail(`${displayName}: text on the accent button is only ${buttonRatio.toFixed(1)}:1`);
  }
}

// --- 4. a pairing is always one theme.ts actually defines --------------------
// A family we do not load renders as the fallback stack, so the page silently
// stops looking like the design that was picked.

for (const key of names) {
  const seeds = seedsFromTheme(fixtures[key].theme);
  if (!FONT_PAIRINGS.includes(seeds.fontFamily)) {
    fail(`${fixtures[key].displayName}: fontFamily "${seeds.fontFamily}" is not a pairing theme.ts defines`);
  }
}

check('a serif over Montserrat is the luxe pairing',
  pairingFor({ heading: 'Playfair Display', body: 'Montserrat' }), 'luxe');
check('Cormorant is atelier', pairingFor({ heading: 'Cormorant Garamond', body: 'Outfit' }), 'atelier');
check('two sans faces stay sans', pairingFor({ heading: 'Space Grotesk', body: 'Space Grotesk' }), 'sans');
check('a family we do not load falls back, not through',
  pairingFor({ heading: 'Bricolage Grotesque', body: 'Bricolage Grotesque' }), 'sans');

// --- 5. degenerate input does not throw --------------------------------------
// Stitch is a third party mid-flight. An empty or half-built theme must produce
// a usable page, because the alternative is a 500 on the intake path.

for (const junk of [null, undefined, {}, { colorMode: 'LIGHT' }, { namedColors: {} }, { colorMode: 'DARK' }]) {
  let seeds;
  try {
    seeds = seedsFromTheme(junk as any);
  } catch (err) {
    fail(`seedsFromTheme threw on ${JSON.stringify(junk)}: ${(err as Error).message}`);
    continue;
  }
  if (!/^#[0-9a-f]{6}$/i.test(seeds.primaryColor) || !/^#[0-9a-f]{6}$/i.test(seeds.accentColor)) {
    fail(`seedsFromTheme returned a non-colour for ${JSON.stringify(junk)}: ${JSON.stringify(seeds)}`);
  }
  const r = contrast(seeds.accentColor, seeds.primaryColor);
  if (r < 1.6) fail(`the fallback pair is invisible: ${seeds.accentColor} on ${seeds.primaryColor}`);
}

// --- 6. a response missing its design system yields nothing, not a half-variant

check('no outputComponents means no variant', variantFromResponse({}, 'p1'), null);
check('a response with only prose means no variant',
  variantFromResponse({ outputComponents: [{ text: 'here you go' }] }, 'p1'), null);

{
  const v = variantFromResponse(
    {
      outputComponents: [
        { designSystem: { designSystem: { displayName: 'Terra & Silk', styleGuidelines: 'g', theme: fixtures['terra-and-silk'].theme } } },
        { design: { screens: [{ screenshot: { downloadUrl: 'https://example.test/shot.png' } }] } },
        { text: 'rationale here' },
      ],
    },
    'proj-123',
  );
  if (!v) fail('a complete response produced no variant');
  else {
    check('the variant keeps Stitch’s name', v.name, 'Terra & Silk');
    check('the screenshot is carried', v.screenshotUrl, 'https://example.test/shot.png');
    check('the rationale is carried', v.rationale, 'rationale here');
    check('the project id is carried', v.projectId, 'proj-123');
    check('the raw heading family is kept for the handoff', v.fonts.heading, 'Playfair Display');
    check('the applied pairing is luxe', v.seeds.fontFamily, 'luxe');
  }
}

if (failures) {
  console.error(`\n  smoke-stitch: ${failures} failed\n`);
  process.exit(1);
}
console.log(`  smoke-stitch: ok — ${names.length} real Stitch themes map to readable, correctly-polarised seeds`);
