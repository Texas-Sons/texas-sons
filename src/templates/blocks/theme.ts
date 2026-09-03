export type ThemeName = 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';

export interface ThemeProfile {
  theme?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface ThemeVars extends Record<string, string> {
  '--ts-bg': string;
  '--ts-surface': string;
  '--ts-surface-raised': string;
  '--ts-border': string;
  '--ts-text': string;
  '--ts-muted': string;
  '--ts-accent': string;
  '--ts-accent-soft': string;
  '--ts-accent-border': string;
  '--ts-accent-contrast': string;
  '--ts-accent-red': string;
  '--ts-accent-red-soft': string;
  '--ts-accent-red-border': string;
  '--ts-font-heading': string;
  '--ts-font-body': string;
}

const THEME_BG: Record<string, { bg: string; dark: boolean }> = {
  'campaign-navy': { bg: '#00081e', dark: true },
  'campaign-judicial': { bg: '#f8fafc', dark: false },
  'crimson-bold': { bg: '#180507', dark: true },
  'emerald-gold': { bg: '#041a14', dark: true },
  luxury: { bg: '#1c1917', dark: true },
  dark: { bg: '#0c0a09', dark: true },
  light: { bg: '#fafaf9', dark: false },
  custom: { bg: '#0c0a09', dark: true },
};

// Font families must match what client.html actually loads:
// Cinzel, Playfair Display, Inter.
const FONTS: Record<string, { heading: string; body: string }> = {
  judicial: {
    heading: "'Libre Caslon Text', serif",
    body: "'Montserrat', sans-serif",
  },
  sans: {
    heading: "'Inter', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  serif: {
    heading: "'Playfair Display', ui-serif, Georgia, serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  display: {
    heading: "'Cinzel', ui-serif, Georgia, serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  // Editorial serif headline over a geometric sans body — the pairing the
  // Opalescent Stitch designs use, and the right register for salons, spas and
  // anything selling craft rather than speed.
  luxe: {
    heading: "'Playfair Display', ui-serif, Georgia, serif",
    body: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
  },
  // Lighter and more open than luxe. Cormorant has less stroke contrast than
  // Playfair and a taller, narrower bowl, so it reads as quiet rather than
  // decorative at large sizes — which is most of what separates "elegant" from
  // "fancy" on a salon page. Outfit underneath is geometric and nearly
  // invisible, which is the job of a body face here.
  //
  // Added rather than replacing luxe: other sites are already using that
  // pairing and changing it under them is not an improvement they asked for.
  atelier: {
    heading: "'Cormorant Garamond', ui-serif, Georgia, serif",
    body: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  },
};

const TEXAS_CRIMSON = '#bb0027';

/** Ink used on light grounds and behind light accents. Warm, not slate. */
const INK = '#161412';

function toRgb(hex: string): [number, number, number] | null {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Readable text for a button filled with `accent`.
 *
 * Was a hardcoded list of six hex values, so any accent nobody had thought of
 * got white text. A salon whose colour is #e8b4b8 — a pale blush — got white
 * lettering on it at a contrast ratio of 1.7:1, which is not a low score so
 * much as an invisible button.
 *
 * Measured instead of listed, so it is right for every colour a client picks
 * rather than for the six we happened to enumerate.
 */
function readableOn(accent: string): string {
  return contrast(accent, INK) >= contrast(accent, '#ffffff') ? INK : '#ffffff';
}

function toHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: sat, l };
}

function hsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][seg < 0 ? seg + 6 : seg];
  const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Surfaces, borders and text for a light ground, derived from the ground itself.
 *
 * Every light theme used to get the same six slate values — #ffffff surface,
 * #0f172a text, #cbd5e1 borders. Slate is blue, so a warm cream page was
 * rendered with cool grey lines and cold near-black type, and the result read
 * as a bright site rather than a calm one. That mismatch is most of what
 * separates a palette that looks chosen from one that looks defaulted.
 *
 * Keeping the ground's hue and moving only lightness and saturation means a
 * cream page gets warm greys, a pale blue page gets cool ones, and neither
 * needs its own entry in a table.
 *
 * Dark grounds keep the original constants: they already read as warm charcoal,
 * and every site deployed to date is on one.
 */
function lightNeutrals(bg: string) {
  const base = toHsl(bg) || { h: 30, s: 0.2, l: 0.95 };
  const h = base.h;
  const s = Math.min(base.s, 0.45);
  return {
    surface: hsl(h, s * 0.9, Math.min(0.985, base.l + 0.045)),
    surfaceRaised: hsl(h, s * 0.85, Math.max(0.82, base.l - 0.045)),
    border: hsl(h, s * 0.6, Math.max(0.78, base.l - 0.075)),
    text: hsl(h, Math.min(s, 0.14), 0.08),
    // 0.41 rather than the 0.45 that looks right by eye: muted carries real
    // body copy — service descriptions, section subtitles — and at 0.45 it
    // measured 4.0:1 on a cream ground, under the 4.5:1 needed to read
    // comfortably. The reference design this was taken from has the same
    // problem; matching it exactly would have meant copying the fault.
    muted: hsl(h, Math.min(s, 0.1), 0.41),
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildThemeVars(profile: ThemeProfile = {}): ThemeVars {
  const entry = THEME_BG[profile.theme || 'dark'] || THEME_BG.dark;
  const bg = profile.theme === 'custom' && profile.primaryColor ? profile.primaryColor : entry.bg;

  /**
   * A custom ground decides for itself whether it is dark.
   *
   * `custom` was pinned dark in the table, so choosing a cream background gave
   * a cream page with near-white text on it — the theme that exists for manual
   * control was the one theme that could not be made light.
   */
  const dark =
    profile.theme === 'light' || profile.theme === 'campaign-judicial'
      ? false
      : profile.theme === 'custom'
        ? luminance(bg) < 0.4
        : entry.dark;

  const accent = profile.accentColor || (profile.theme === 'campaign-judicial' ? '#C5A059' : (dark ? '#f97316' : '#ea580c'));
  const isJudicial = profile.theme === 'campaign-judicial';
  const fonts = isJudicial ? FONTS.judicial : (FONTS[profile.fontFamily || 'sans'] || FONTS.sans);
  const n = dark ? null : lightNeutrals(bg);

  return {
    '--ts-bg': bg,
    '--ts-surface': dark ? '#1c1917' : n!.surface,
    '--ts-surface-raised': dark ? '#292524' : n!.surfaceRaised,
    '--ts-border': dark ? '#292524' : n!.border,
    '--ts-text': dark ? '#fafaf9' : n!.text,
    '--ts-muted': dark ? '#a8a29e' : n!.muted,
    '--ts-accent': accent,
    '--ts-accent-soft': hexToRgba(accent, 0.12),
    '--ts-accent-border': hexToRgba(accent, 0.35),
    '--ts-accent-contrast': readableOn(accent),
    '--ts-accent-red': TEXAS_CRIMSON,
    '--ts-accent-red-soft': hexToRgba(TEXAS_CRIMSON, 0.12),
    '--ts-accent-red-border': hexToRgba(TEXAS_CRIMSON, 0.35),
    '--ts-font-heading': fonts.heading,
    '--ts-font-body': fonts.body,
  };
}

export const TS_VAR = {
  bg: 'var(--ts-bg, #0c0a09)',
  surface: 'var(--ts-surface, #1c1917)',
  surfaceRaised: 'var(--ts-surface-raised, #292524)',
  border: 'var(--ts-border, #292524)',
  text: 'var(--ts-text, #fafaf9)',
  muted: 'var(--ts-muted, #a8a29e)',
  accent: 'var(--ts-accent, #f97316)',
  accentSoft: 'var(--ts-accent-soft, rgba(249, 115, 22, 0.12))',
  accentBorder: 'var(--ts-accent-border, rgba(249, 115, 22, 0.35))',
  accentContrast: 'var(--ts-accent-contrast, #ffffff)',
  accentRed: 'var(--ts-accent-red, #bb0027)',
  accentRedSoft: 'var(--ts-accent-red-soft, rgba(187, 0, 39, 0.12))',
  accentRedBorder: 'var(--ts-accent-red-border, rgba(187, 0, 39, 0.35))',
  fontHeading: 'var(--ts-font-heading, inherit)',
  fontBody: 'var(--ts-font-body, inherit)',
};
