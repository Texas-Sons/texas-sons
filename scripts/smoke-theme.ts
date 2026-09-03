/**
 * Tests for the theme derivation.
 *
 * Two properties, both of which shipped broken.
 *
 * 1. **No accent ever gets unreadable text on it.** The colour used for
 *    lettering on an accent-filled button was chosen from a hardcoded list of
 *    six hex values, so anything not on the list got white. Opalescent's blush
 *    is #e8b4b8; white on it measures 1.7:1, which is not a poor contrast score
 *    so much as an invisible button. It is measured now, so it is right for
 *    whatever colour a client turns up with.
 *
 * 2. **A light ground gets neutrals that share its hue.** Every light theme was
 *    given the same slate values, and slate is blue — so a warm cream page was
 *    drawn with cool grey rules and cold near-black type. The mismatch is most
 *    of what makes a palette read as defaulted rather than chosen.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { buildThemeVars } from '../src/templates/blocks/theme';

let failures = 0;
function fail(msg: string) { failures++; console.error(`  FAIL  ${msg}`); }
function check(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) fail(`${label}\n        expected ${expected}\n        got      ${actual}`);
}

function rgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex: string): number {
  const [r, g, b] = rgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const hueOf = (hex: string): number => {
  const [r, g, b] = rgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return -1;
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return h * 360;
};

// --- 1. text on an accent button is always readable --------------------------

const ACCENTS = [
  '#e8b4b8', // Opalescent blush — the one that was broken
  '#C5A059', // Texas Sons gold
  '#d97706', // luxury amber
  '#f97316', // dark default orange
  '#dc2626', // crimson-bold
  '#bb0027', // Texas crimson
  '#022c22', // deep emerald
  '#ffffff', // degenerate: white accent
  '#000000', // degenerate: black accent
  '#7dd3fc', // a pale blue nobody has used yet
  '#fef08a', // a pale yellow nobody has used yet
];

for (const accent of ACCENTS) {
  const v = buildThemeVars({ theme: 'custom', primaryColor: '#f4efe8', accentColor: accent } as any);
  const on = v['--ts-accent-contrast'];
  const r = ratio(accent, on);
  // 4.5:1 is the WCAG AA threshold for body text. Button labels here are bold
  // and often large, where 3:1 would pass — holding the stricter line because
  // the cost of clearing it is choosing between two colours we already have.
  if (r < 4.5) {
    fail(`text on ${accent} is ${on}, contrast ${r.toFixed(2)}:1 — below 4.5:1`);
  }
}

// --- 2. light neutrals share the ground's hue --------------------------------

{
  // Her cream. The values the reference design arrived at by hand were
  // #fbf8f4 surface, #e4dcd4 line, #161412 ink, #7a726c muted. Deriving from
  // the ground alone should land in the same neighbourhood.
  const v = buildThemeVars({ theme: 'custom', primaryColor: '#f4efe8', accentColor: '#e8b4b8' } as any);

  check('a cream ground stays the background', v['--ts-bg'], '#f4efe8');

  const groundHue = hueOf('#f4efe8');
  for (const key of ['--ts-surface', '--ts-surface-raised', '--ts-border', '--ts-muted'] as const) {
    const h = hueOf(v[key]);
    if (h >= 0 && Math.abs(h - groundHue) > 20) {
      fail(`${key} is ${v[key]}, hue ${h.toFixed(0)} — the ground is hue ${groundHue.toFixed(0)}; neutrals must share it`);
    }
  }

  // Warm, not slate. The old value here was #0f172a, which is blue.
  const textHue = hueOf(v['--ts-text']);
  if (textHue > 60 && textHue < 300) {
    fail(`--ts-text is ${v['--ts-text']}, hue ${textHue.toFixed(0)} — that is a cool cast on a warm ground`);
  }

  if (ratio(v['--ts-text'], '#f4efe8') < 7) {
    fail(`--ts-text on the ground is only ${ratio(v['--ts-text'], '#f4efe8').toFixed(1)}:1`);
  }
  if (ratio(v['--ts-muted'], '#f4efe8') < 4.5) {
    fail(`--ts-muted on the ground is only ${ratio(v['--ts-muted'], '#f4efe8').toFixed(1)}:1`);
  }
}

// --- 3. a custom ground decides whether it is dark ---------------------------
// `custom` was pinned dark in the table, so the one theme meant for manual
// control was the one that could not be made light.

{
  const light = buildThemeVars({ theme: 'custom', primaryColor: '#f4efe8' } as any);
  if (ratio(light['--ts-text'], '#f4efe8') < 7) fail('a light custom ground did not get dark text');

  const dark = buildThemeVars({ theme: 'custom', primaryColor: '#12100e' } as any);
  if (ratio(dark['--ts-text'], '#12100e') < 7) fail('a dark custom ground did not get light text');
}

// --- 4. the themes already deployed are unchanged ----------------------------

for (const theme of ['campaign-navy', 'campaign-judicial', 'luxury', 'dark', 'crimson-bold', 'emerald-gold'] as const) {
  const v = buildThemeVars({ theme } as any);
  const bg = v['--ts-bg'];
  if (ratio(v['--ts-text'], bg) < 7) {
    fail(`${theme}: text ${v['--ts-text']} on ${bg} is only ${ratio(v['--ts-text'], bg).toFixed(1)}:1`);
  }
}

check('campaign-navy still renders on navy',
  buildThemeVars({ theme: 'campaign-navy' } as any)['--ts-bg'], '#00081e');

// --- 5. the snapshot's theme beats the profile's stale duplicate -------------
// The theme is stored twice, at blueprint.theme and blueprint.profile.theme.
// They agree for as long as everyone remembers to set both. The day they
// disagreed, the deployed site rendered the profile copy and a cream blueprint
// published on near-black, with nothing in the Studio able to explain it —
// because the Studio reads the other one.

{
  const clientApp = readFileSync(join(process.cwd(), 'src', 'ClientApp.tsx'), 'utf8');
  const call = clientApp.match(/buildThemeVars\(([\s\S]{0,220}?)\)\s*as React\.CSSProperties/);
  if (!call) {
    fail('could not find the buildThemeVars call in ClientApp.tsx');
  } else if (!/theme:\s*project\.theme/.test(call[1])) {
    fail(
      'ClientApp renders the deployed site without passing project.theme. It '
      + 'falls back to profile.theme, a stale duplicate, so a light theme '
      + 'silently publishes dark.'
    );
  }

  const studio = readFileSync(
    join(process.cwd(), 'src', 'components', 'AgentBuilder', 'AgentBuilderStudio.tsx'), 'utf8');
  // Spread order is the whole point: {theme, ...profile} lets the duplicate win.
  if (/buildThemeVars\(\{\s*theme:\s*project\.theme,\s*\.\.\.project\.profile\s*\}/.test(studio)) {
    fail('AgentBuilderStudio spreads project.profile after theme, so profile.theme overrides it');
  }
}

if (failures) {
  console.error(`\n  smoke-theme: ${failures} failed\n`);
  process.exit(1);
}
console.log('  smoke-theme: ok — every accent gets readable text, light neutrals share the ground hue');
