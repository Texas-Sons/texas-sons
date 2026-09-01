import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Merges client-managed media into a blueprint at deploy time.
 *
 * The operator owns the blueprint — design, copy, services, pricing. The client
 * owns their portfolio, transformations and product shelf. They live in separate
 * tables so neither can overwrite the other, and are combined only here, on the
 * way to a deploy.
 *
 * Client media wins where both exist. She is the authority on which photos of
 * her own work should be public; a stock placeholder from a mockup should never
 * survive once she has uploaded the real thing.
 */

export type MediaKind = 'portfolio' | 'beforeAfter' | 'product';

/**
 * Stock imagery standing in for a photo nobody has taken yet.
 *
 * Only these lose to a client upload. Anything else in the gallery was chosen
 * by the operator, and a client adding her own work must not silently delete it.
 */
export function isPlaceholderImage(url: unknown): boolean {
  return typeof url === 'string' && /images\.unsplash\.com/i.test(url);
}

export interface ClientMediaRow {
  id: string;
  kind: MediaKind;
  data: Record<string, any>;
  sort_order: number;
}

export interface MergeResult {
  blueprint: any;
  /** What the client contributed, for logging and for the deploy response. */
  applied: Record<MediaKind, number>;
}

/**
 * The client's own gallery photos, in the order they will appear.
 *
 * Requires a url; a row without one is a half-finished upload, not a photo.
 *
 * Exported because the Studio's gallery editor has to show these too. It used
 * to list only the operator's own `galleryImages`, which is not what the site
 * renders — hers lead, and any stock stand-in of the operator's is dropped
 * outright once she has uploaded anything. So the editor showed five photos
 * that were not on the site and none of the ones that were.
 */
export function portfolioPhotos(media: ClientMediaRow[]): string[] {
  return media
    .filter(m => m.kind === 'portfolio')
    .map(m => m.data?.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
}

/** Reads a project's live client media, lowest sort_order first. */
export async function fetchClientMedia(
  db: SupabaseClient,
  projectId: string
): Promise<ClientMediaRow[]> {
  const { data, error } = await db
    .from('client_media')
    .select('id, kind, data, sort_order')
    .eq('project_id', projectId)
    .eq('hidden', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    // A media read failure must not take down a deploy — the site still has the
    // operator's blueprint, which is a complete site on its own. Deploying
    // slightly stale content beats refusing to deploy at all.
    console.error('[clientMedia] read failed, deploying without client media:', error.message);
    return [];
  }
  return (data || []) as ClientMediaRow[];
}

/**
 * Produces a new blueprint with client media folded in. Never mutates the input.
 */
export function mergeClientMedia(blueprint: any, media: ClientMediaRow[]): MergeResult {
  const merged = JSON.parse(JSON.stringify(blueprint || {}));
  merged.profile = merged.profile || {};

  const applied: Record<MediaKind, number> = { portfolio: 0, beforeAfter: 0, product: 0 };
  if (!media.length) return { blueprint: merged, applied };

  const byKind = (kind: MediaKind) => media.filter(m => m.kind === kind);

  const portfolio = portfolioPhotos(media);
  if (portfolio.length) {
    // Her photos REPLACE placeholders and are ADDED alongside anything real.
    //
    // This used to assign the whole array, so a client uploading her first photo
    // replaced a curated five-image gallery with one image. That happened to a
    // live salon site on 2026-08-31 and read, correctly, as the site being
    // wiped. Uploading a photo should add a photo.
    //
    // A stock stand-in still loses — that is the entire point of the portal —
    // but an image the operator chose deliberately is not a placeholder and is
    // not hers to remove by uploading something.
    const existing: string[] = Array.isArray(merged.profile.galleryImages)
      ? merged.profile.galleryImages.filter(
          (u: unknown) => typeof u === 'string' && u.length > 0 && !isPlaceholderImage(u)
        )
      : [];

    // Hers first: she is the authority on her own work, and the gallery reads
    // top-down.
    const seen = new Set<string>();
    merged.profile.galleryImages = [...portfolio, ...existing].filter(u => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
    applied.portfolio = portfolio.length;

    // Her first real photo is a better hero than a stock stand-in. Only replace
    // a placeholder, never a hero the operator chose deliberately.
    const hero = merged.profile.heroImage;
    if (!hero || isPlaceholderImage(hero)) {
      merged.profile.heroImage = portfolio[0];
    }
  }

  // Pairs need both halves; one image is not a comparison.
  const pairs = byKind('beforeAfter')
    .filter(m => m.data?.before && m.data?.after)
    .map(m => ({
      before: m.data.before,
      after: m.data.after,
      label: m.data.label,
      service: m.data.service,
    }));
  if (pairs.length) {
    merged.beforeAfter = pairs;
    applied.beforeAfter = pairs.length;
  }

  const products = byKind('product')
    .filter(m => m.data?.name)
    .map(m => ({
      name: m.data.name,
      description: m.data.description,
      price: m.data.price,
      image: m.data.image,
      url: m.data.url,
      availability: m.data.availability,
      featured: !!m.data.featured,
    }));
  if (products.length) {
    merged.products = products;
    applied.product = products.length;
  }

  return { blueprint: merged, applied };
}

/** Convenience: read and merge in one call. */
export async function blueprintWithClientMedia(
  db: SupabaseClient,
  projectId: string,
  blueprint: any
): Promise<MergeResult> {
  const media = await fetchClientMedia(db, projectId);
  return mergeClientMedia(blueprint, media);
}
