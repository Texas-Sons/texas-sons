import { supabase } from '../supabase';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * Prospect pipeline — saved leads and dismissed places from the Maps search.
 *
 * Both live in one table separated by `status`, because they are the same thing
 * at different stages: a place you've triaged. Dismissals matter as much as
 * saves — losing them means re-reviewing businesses you already rejected.
 */

const SAVED_CACHE_KEY = 'txsons_saved_leads';
const DISMISSED_CACHE_KEY = 'txsons_dismissed_places';

export interface Prospect {
  id: string;
  [k: string]: any;
}

export async function listSavedProspects(): Promise<Prospect[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Prospect[]>(SAVED_CACHE_KEY, []);

  const { data, error } = await supabase
    .from('prospects')
    .select('id, data')
    .eq('owner_id', ownerId)
    .eq('status', 'saved')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[store] Saved prospects read failed, serving cache:', error);
    return readCache<Prospect[]>(SAVED_CACHE_KEY, []);
  }

  const prospects = (data || []).map(row => ({ ...(row.data as object), id: row.id })) as Prospect[];
  writeCache(SAVED_CACHE_KEY, prospects);
  return prospects;
}

export async function listDismissedIds(): Promise<string[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<string[]>(DISMISSED_CACHE_KEY, []);

  const { data, error } = await supabase
    .from('prospects')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('status', 'dismissed');

  if (error) {
    console.warn('[store] Dismissed prospects read failed, serving cache:', error);
    return readCache<string[]>(DISMISSED_CACHE_KEY, []);
  }

  const ids = (data || []).map(row => row.id);
  writeCache(DISMISSED_CACHE_KEY, ids);
  return ids;
}

export async function saveProspect(prospect: Prospect): Promise<void> {
  if (!prospect?.id) return;
  const ownerId = await requireOwnerId();

  const cached = readCache<Prospect[]>(SAVED_CACHE_KEY, []);
  if (!cached.some(p => p.id === prospect.id)) {
    writeCache(SAVED_CACHE_KEY, [prospect, ...cached]);
  }

  const { error } = await supabase.from('prospects').upsert({
    id: prospect.id,
    owner_id: ownerId,
    status: 'saved',
    data: prospect,
  });
  if (error) {
    console.error('[store] Prospect save failed:', error);
    throw new Error(error.message || 'Could not save the prospect.');
  }
}

export async function unsaveProspect(id: string): Promise<void> {
  const ownerId = await requireOwnerId();

  writeCache(
    SAVED_CACHE_KEY,
    readCache<Prospect[]>(SAVED_CACHE_KEY, []).filter(p => p.id !== id)
  );

  const { error } = await supabase.from('prospects').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    console.error('[store] Prospect unsave failed:', error);
    throw new Error(error.message || 'Could not remove the prospect.');
  }
}

export async function dismissProspect(id: string, snapshot: Prospect | null = null): Promise<void> {
  const ownerId = await requireOwnerId();

  const cached = readCache<string[]>(DISMISSED_CACHE_KEY, []);
  if (!cached.includes(id)) writeCache(DISMISSED_CACHE_KEY, [...cached, id]);

  const { error } = await supabase.from('prospects').upsert({
    id,
    owner_id: ownerId,
    status: 'dismissed',
    data: snapshot || {},
  });
  if (error) {
    console.error('[store] Prospect dismiss failed:', error);
    throw new Error(error.message || 'Could not dismiss the prospect.');
  }
}

/** Clears dismissals so previously-rejected places resurface in search. */
export async function restoreDismissed(): Promise<void> {
  const ownerId = await requireOwnerId();
  writeCache(DISMISSED_CACHE_KEY, []);

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('owner_id', ownerId)
    .eq('status', 'dismissed');
  if (error) {
    console.error('[store] Restoring dismissed prospects failed:', error);
    throw new Error(error.message || 'Could not restore dismissed prospects.');
  }
}

export function cachedSavedProspects(): Prospect[] {
  return readCache<Prospect[]>(SAVED_CACHE_KEY, []);
}

export function cachedDismissedIds(): string[] {
  return readCache<string[]>(DISMISSED_CACHE_KEY, []);
}
