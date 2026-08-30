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

  // Portfolio -> gallery images. Requires a url; a row without one is a
  // half-finished upload, not a photo.
  const portfolio = byKind('portfolio')
    .map(m => m.data?.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
  if (portfolio.length) {
    merged.profile.galleryImages = portfolio;
    applied.portfolio = portfolio.length;

    // Her first real photo is a better hero than a stock stand-in. Only replace
    // a placeholder, never a hero the operator chose deliberately.
    const hero = merged.profile.heroImage;
    if (!hero || /images\.unsplash\.com/i.test(hero)) {
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
