/**
 * Stitch service client.
 *
 * Stitch has no REST API. It speaks MCP at stitch.googleapis.com/mcp — but
 * `tools/call` there needs no `initialize` handshake and carries no session, so
 * one POST per call is the entire protocol. That is why this file is a fetch
 * wrapper rather than an MCP SDK dependency.
 *
 * What we adopt from a generated design system is deliberately small. Stitch
 * returns a full Material-3 palette — forty-odd named colours, a type scale, a
 * spacing scale — and it is tempting to take all of it. We take four values.
 *
 * The reason is buildThemeVars: it measures contrast to choose the text that
 * sits on an accent, and derives neutrals sharing the ground's hue. Stitch can
 * do neither, because it does not know what our blocks place next to what.
 * Adopting its whole palette would replace a system that guarantees a readable
 * button with one that does not. Stitch chooses the direction; our own
 * derivation renders it.
 */

import { luminance, contrast, FONT_PAIRINGS } from '../src/templates/blocks/theme';

const STITCH_URL = process.env.STITCH_MCP_URL || 'https://stitch.googleapis.com/mcp';

/** How long one Stitch call may run. Generation genuinely takes ~100 seconds. */
const CALL_TIMEOUT_MS = 240_000;

export function isStitchConfigured(): boolean {
  return Boolean(process.env.STITCH_API_KEY);
}

/** The three values we actually adopt. Everything else Stitch says is advisory. */
export interface StitchSeeds {
  /** The page ground. Called primaryColor because that is the blueprint's name for it. */
  primaryColor: string;
  accentColor: string;
  /**
   * A key from theme.ts's FONTS, never a raw family name. Stitch will happily
   * ask for Bricolage Grotesque; index.html loads a fixed set of faces, so an
   * unknown family renders as the fallback stack and the page quietly looks
   * nothing like the design that was chosen. Mapping to the nearest pairing we
   * actually load is the honest version of that.
   */
  fontFamily: string;
}

export interface StitchVariant {
  /** Stitch's own name for the direction, e.g. "Terra & Silk". */
  name: string;
  seeds: StitchSeeds;
  /** Stitch's prose explanation. Carried into the handoff prompt, not applied. */
  rationale: string;
  /** Long-form style guidelines. Advisory: useful to a human, not to the renderer. */
  guidelines: string;
  /**
   * The families Stitch actually asked for, kept even though seeds.fontFamily
   * is what gets applied. If it wanted Bricolage Grotesque and we mapped that
   * to sans, the handoff prompt should say so rather than quietly lose it.
   */
  fonts: { heading: string; body: string };
  screenshotUrl?: string;
  projectId: string;
}

async function stitchCall<T = any>(name: string, args: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) throw new Error('STITCH_API_KEY is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(STITCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name, arguments: args },
        id: Date.now(),
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // The error body can echo the request. Keep it out of the message so a key
    // sent in the wrong header cannot end up in a log line.
    throw new Error(`Stitch ${name} failed with HTTP ${res.status}`);
  }
  const json: any = await res.json();
  if (json.error) {
    throw new Error(`Stitch ${name} failed: ${json.error.message || 'unknown RPC error'}`);
  }

  const text = json.result?.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error(`Stitch ${name} returned no content`);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

/** SPACE_GROTESK -> Space Grotesk, for systems that only set the enum. */
function fontFromEnum(v: unknown): string | undefined {
  if (typeof v !== 'string' || !v) return undefined;
  if (!/^[A-Z0-9_]+$/.test(v)) return v;
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Below this luminance a colour is treated as a dark ground. */
const DARK_GROUND = 0.18;

/**
 * Map a Stitch theme onto our four seeds.
 *
 * The colour slots cannot be trusted positionally. Across real systems pulled
 * from Stitch, `overrideNeutralColor` was #f2f2f2 — a light ground — in one and
 * #2d241e — dark ink — in another. Reading that slot as "the ground" would
 * publish a cream salon on near-black: the same failure as the theme being
 * stored in two places, arriving by a different road.
 *
 * `namedColors.surface` meant the same thing in every sample, so it leads, and
 * the answer is checked against colorMode instead of assumed. When nothing
 * agrees we take the extreme on the side colorMode asked for — possibly an odd
 * shade, never the opposite polarity.
 */
export function seedsFromTheme(theme: any): StitchSeeds {
  const wantDark = String(theme?.colorMode || '').toUpperCase() === 'DARK';
  const named = theme?.namedColors || {};

  const groundCandidates = [
    named.surface,
    named['surface-container-lowest'],
    theme?.overrideSecondaryColor,
    theme?.overrideNeutralColor,
  ].filter(isHex);

  const matchesMode = (c: string) => luminance(c) < DARK_GROUND === wantDark;
  let primaryColor = groundCandidates.find(matchesMode);
  if (!primaryColor && groundCandidates.length) {
    const sorted = [...groundCandidates].sort((a, b) => luminance(a) - luminance(b));
    primaryColor = wantDark ? sorted[0] : sorted[sorted.length - 1];
  }
  if (!primaryColor) primaryColor = wantDark ? '#12100e' : '#f7f4ef';

  // The accent must be visible on the ground it will sit on. A system whose
  // primary equals its own surface is not unheard of.
  const accentCandidates = [
    theme?.overridePrimaryColor,
    theme?.customColor,
    theme?.overrideTertiaryColor,
    theme?.overrideSecondaryColor,
  ].filter(isHex);
  const accentColor =
    accentCandidates.find((c) => contrast(c, primaryColor as string) >= 1.6) ||
    accentCandidates[0] ||
    (wantDark ? '#e8b4b8' : '#8a5a2b');

  return { primaryColor, accentColor, fontFamily: pairingFor(fontsOf(theme)) };
}

/** The families Stitch named, before they are collapsed onto a pairing. */
export function fontsOf(theme: any): { heading: string; body: string } {
  return {
    heading:
      theme?.headlineFontFamily || fontFromEnum(theme?.headlineFont) || fontFromEnum(theme?.font) || '',
    body: theme?.bodyFontFamily || fontFromEnum(theme?.bodyFont) || fontFromEnum(theme?.font) || '',
  };
}

/** Families we load that read as serif. Anything else is treated as a sans. */
const SERIFS = [
  'playfair', 'cormorant', 'caslon', 'garamond', 'lora', 'merriweather', 'baskerville',
  'crimson', 'spectral', 'georgia', 'times', 'cardo', 'domine', 'vollkorn', 'cinzel',
  'source serif', 'pt serif', 'noto serif', 'dm serif', 'instrument serif', 'bodoni', 'didot',
];
const isSerif = (f: string) => {
  const n = f.toLowerCase();
  return n.includes('serif') || n.includes('slab') || SERIFS.some((s) => n.includes(s));
};

/**
 * Collapse a pair of families onto one of ours.
 *
 * Ordered most specific first: an exact face we already pair beats the generic
 * serif-over-sans bucket, because atelier and luxe differ in register and
 * picking the wrong one is the difference between "quiet" and "fancy".
 */
export function pairingFor(fonts: { heading: string; body: string }): string {
  const h = (fonts.heading || '').toLowerCase();
  const b = (fonts.body || '').toLowerCase();
  let key: string;
  if (h.includes('cormorant')) key = 'atelier';
  else if (h.includes('cinzel')) key = 'display';
  else if (h.includes('caslon')) key = 'judicial';
  else if (isSerif(h)) key = b.includes('montserrat') || b.includes('outfit') ? 'luxe' : 'serif';
  else key = 'sans';
  // A key theme.ts does not define would silently fall back to sans, so prove
  // it exists here instead of discovering it on a client's live page.
  return FONT_PAIRINGS.includes(key) ? key : 'sans';
}

/** Pull what we care about out of a generate_screen_from_text response. */
export function variantFromResponse(res: any, projectId: string): StitchVariant | null {
  const parts: any[] = Array.isArray(res?.outputComponents) ? res.outputComponents : [];
  const ds = parts.find((p) => p?.designSystem)?.designSystem?.designSystem;
  if (!ds?.theme) return null;
  const screen = parts.find((p) => p?.design)?.design?.screens?.[0];
  return {
    name: ds.displayName || 'Untitled direction',
    seeds: seedsFromTheme(ds.theme),
    rationale: parts.find((p) => typeof p?.text === 'string')?.text || '',
    guidelines: ds.styleGuidelines || '',
    fonts: fontsOf(ds.theme),
    screenshotUrl: screen?.screenshot?.downloadUrl,
    projectId,
  };
}

export interface VariantBrief {
  businessName: string;
  category?: string;
  tagline?: string;
  description?: string;
  services?: Array<{ title?: string }>;
  address?: string;
}

/**
 * The two directions we ask for.
 *
 * Two separate calls rather than Stitch's own `generate_variants`, which needs
 * an existing screen to vary and takes an undocumented `variantOptions` shape.
 * Two independent prompts also guarantee the pair is genuinely different rather
 * than two nudges of one idea — which is the entire point of offering a choice.
 */
export const VARIANT_STEERS = [
  'Warm and editorial: generous whitespace, a serif display face, photography leading. '
    + 'Commit to a warm palette drawn from the trade itself — clay, ember, tobacco, leather. '
    + 'Do not return an all-neutral scheme.',
  'Clean and modern: a tighter grid, a geometric sans, and one confident saturated accent '
    + 'doing the work instead of imagery. Pick a decisive hue, not a near-black on near-white.',
];

function briefToPrompt(brief: VariantBrief, steer: string): string {
  const services = (brief.services || [])
    .slice(0, 6)
    .map((s) => s?.title)
    .filter(Boolean)
    .join(', ');
  return [
    `Home page for ${brief.businessName}${brief.category ? `, a ${brief.category} business` : ''}${brief.address ? ` in ${brief.address}` : ''}.`,
    brief.tagline ? `Tagline: ${brief.tagline}` : '',
    brief.description ? `About: ${brief.description}` : '',
    services ? `Services offered: ${services}.` : '',
    `Direction: ${steer}`,
    'Sections: hero with a booking call to action, featured services, gallery, testimonials, and a footer with hours and address.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Generate one direction. Resolves to null rather than throwing, so one steer
 * failing never takes the other down with it.
 */
async function generateOne(projectId: string, brief: VariantBrief, steer: string): Promise<StitchVariant | null> {
  try {
    const res = await stitchCall('generate_screen_from_text', {
      projectId,
      deviceType: 'DESKTOP',
      prompt: briefToPrompt(brief, steer),
    });
    const v = variantFromResponse(res, projectId);
    if (!v) console.warn('[stitch] A generation returned no design system.');
    return v;
  } catch (err: any) {
    console.warn(`[stitch] A generation failed: ${err?.message || err}`);
    return null;
  }
}

export async function generateVariants(brief: VariantBrief): Promise<StitchVariant[]> {
  const project: any = await stitchCall('create_project', { title: `${brief.businessName} — Texas Sons` });
  const projectId = String(project?.name || '').split('/').pop();
  if (!projectId) throw new Error('Stitch create_project returned no project id');

  // Fired together, then any that came back empty is retried once on its own.
  //
  // Both are needed. Observed live: one run returned both directions in 111s,
  // the next returned one in 193s with no error raised — Stitch simply produced
  // nothing for the second prompt. Since the entire feature is "choose between
  // two", quietly handing back one is a failure, not a degraded success. The
  // retry is sequential because concurrency is the most likely cause.
  const settled = await Promise.all(VARIANT_STEERS.map((steer) => generateOne(projectId, brief, steer)));

  for (let i = 0; i < settled.length; i++) {
    if (settled[i]) continue;
    console.warn(`[stitch] Retrying direction ${i + 1} on its own.`);
    settled[i] = await generateOne(projectId, brief, VARIANT_STEERS[i]);
  }

  const variants = settled.filter((v): v is StitchVariant => Boolean(v));
  if (!variants.length) throw new Error('Stitch produced no usable direction, twice.');
  if (variants.length < VARIANT_STEERS.length) {
    // Surfaced rather than hidden: the operator gets what there is, and the log
    // says why it is short.
    console.warn(`[stitch] Only ${variants.length} of ${VARIANT_STEERS.length} directions survived.`);
  }
  return variants;
}
