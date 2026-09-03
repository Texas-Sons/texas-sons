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

const LIGHT_ACCENTS = ['#C5A059', '#fbbf24', '#facc15', '#eab308', '#d97706', '#f59e0b'];
const TEXAS_CRIMSON = '#bb0027';

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
  const dark = profile.theme === 'light' ? false : (profile.theme === 'campaign-judicial' ? false : entry.dark);
  const bg = profile.theme === 'custom' && profile.primaryColor ? profile.primaryColor : entry.bg;
  const accent = profile.accentColor || (profile.theme === 'campaign-judicial' ? '#C5A059' : (dark ? '#f97316' : '#ea580c'));
  const lightAccent = LIGHT_ACCENTS.includes(String(accent).toUpperCase());
  const isJudicial = profile.theme === 'campaign-judicial';
  const fonts = isJudicial ? FONTS.judicial : (FONTS[profile.fontFamily || 'sans'] || FONTS.sans);

  return {
    '--ts-bg': bg,
    '--ts-surface': dark ? '#1c1917' : '#ffffff',
    '--ts-surface-raised': dark ? '#292524' : '#f1f5f9',
    '--ts-border': dark ? '#292524' : '#cbd5e1',
    '--ts-text': dark ? '#fafaf9' : '#0f172a',
    '--ts-muted': dark ? '#a8a29e' : '#475569',
    '--ts-accent': accent,
    '--ts-accent-soft': hexToRgba(accent, 0.12),
    '--ts-accent-border': hexToRgba(accent, 0.35),
    '--ts-accent-contrast': lightAccent ? '#00081e' : '#ffffff',
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
