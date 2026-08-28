import { supabase } from '../supabase';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * The blueprint library — reusable site definitions.
 *
 * This is the single most valuable artifact in the Studio and it used to live
 * only in the operator's browser. Clearing site data destroyed it.
 */

const CACHE_KEY = 'txsons_custom_blueprints';

export interface Blueprint {
  id: string;
  profile?: { name?: string; [k: string]: any };
  [k: string]: any;
}

function nameOf(blueprint: Blueprint): string {
  return blueprint.profile?.name || blueprint.prompt || 'Untitled blueprint';
}

export async function listBlueprints(): Promise<Blueprint[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Blueprint[]>(CACHE_KEY, []);

  const { data, error } = await supabase
    .from('blueprints')
    .select('id, data')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('[store] Blueprint read failed, serving cache:', error);
    return readCache<Blueprint[]>(CACHE_KEY, []);
  }

  // Unwrap to the flat shape the Studio already expects, and keep the cache
  // populated so a cold start with no connection still renders.
  const blueprints = (data || []).map(row => ({ ...(row.data as object), id: row.id })) as Blueprint[];
  writeCache(CACHE_KEY, blueprints);
  return blueprints;
}

export async function saveBlueprint(blueprint: Blueprint): Promise<void> {
  if (!blueprint?.id) throw new Error('Blueprint needs an id before it can be saved.');
  const ownerId = await requireOwnerId();

  // Keep the flat cache in sync immediately so the UI does not flicker.
  const cached = readCache<Blueprint[]>(CACHE_KEY, []);
  const exists = cached.some(b => b.id === blueprint.id);
  writeCache(
    CACHE_KEY,
    exists ? cached.map(b => (b.id === blueprint.id ? blueprint : b)) : [blueprint, ...cached]
  );

  const { error } = await supabase.from('blueprints').upsert({
    id: blueprint.id,
    owner_id: ownerId,
    name: nameOf(blueprint),
    data: blueprint,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[store] Blueprint save failed:', error);
    throw new Error(error.message || 'Could not save the blueprint.');
  }
}

export async function removeBlueprint(id: string): Promise<void> {
  const ownerId = await requireOwnerId();

  writeCache(
    CACHE_KEY,
    readCache<Blueprint[]>(CACHE_KEY, []).filter(b => b.id !== id)
  );

  const { error } = await supabase.from('blueprints').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    console.error('[store] Blueprint delete failed:', error);
    throw new Error(error.message || 'Could not delete the blueprint.');
  }
}

/** Synchronous cached read, for render paths that cannot await. */
export function cachedBlueprints(): Blueprint[] {
  return readCache<Blueprint[]>(CACHE_KEY, []);
}
