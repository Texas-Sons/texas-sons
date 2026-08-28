import { supabase } from '../supabase';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * Operator settings — one row per user.
 *
 * Note on `authorizedEmails`: this list is a convenience for managing who *should*
 * have access. It is NOT the security boundary. The real gate is ADMIN_EMAILS on
 * the server, enforced by requireAdmin in lib/auth.ts. Editing this list does not
 * grant anyone access on its own — the server env var has to change too.
 */

const CACHE_KEY = 'txsons_studio_settings';

export type StudioSettings = Record<string, any>;

export async function loadSettings<T extends StudioSettings>(defaults: T): Promise<T> {
  const cached = { ...defaults, ...readCache<Partial<T>>(CACHE_KEY, {}) };

  const ownerId = await getOwnerId();
  if (!ownerId) return cached as T;

  const { data, error } = await supabase
    .from('user_settings')
    .select('data')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    console.warn('[store] Settings read failed, serving cache:', error);
    return cached as T;
  }
  if (!data) return cached as T; // no row yet — first run

  const merged = { ...defaults, ...(data.data as Partial<T>) } as T;
  writeCache(CACHE_KEY, merged);
  return merged;
}

export async function saveSettings(settings: StudioSettings): Promise<void> {
  const ownerId = await requireOwnerId();
  writeCache(CACHE_KEY, settings);

  const { error } = await supabase.from('user_settings').upsert({
    owner_id: ownerId,
    data: settings,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[store] Settings save failed:', error);
    throw new Error(error.message || 'Could not save settings.');
  }
}

export function cachedSettings<T extends StudioSettings>(defaults: T): T {
  return { ...defaults, ...readCache<Partial<T>>(CACHE_KEY, {}) } as T;
}
