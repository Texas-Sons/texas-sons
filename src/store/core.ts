import { supabase } from '../supabase';

/**
 * Shared plumbing for the store layer.
 *
 * Every repository follows the same contract:
 *   - Supabase is the source of truth
 *   - localStorage is a write-through cache, never the authority
 *   - a read that fails falls back to cache rather than showing an empty screen
 *
 * That last point matters: RLS failures and dropped connections both surface as
 * empty result sets, and an OS that silently shows "you have no clients" is worse
 * than one that shows slightly stale clients plus a console warning.
 */

/** Resolves the signed-in user's id. Null when signed out. */
export async function getOwnerId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Resolves the owner id or throws — for writes, which cannot proceed anonymously. */
export async function requireOwnerId(): Promise<string> {
  const ownerId = await getOwnerId();
  if (!ownerId) throw new Error('You must be signed in to save changes.');
  return ownerId;
}

// --- cache ------------------------------------------------------------------

export function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Quota exceeded, private mode, etc. The cache is optional — never let a
    // cache write failure break a successful Supabase write.
    console.warn(`[store] Could not cache ${key}:`, error);
  }
}

export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// --- shapes -----------------------------------------------------------------

/** A row in one of the id + owner + jsonb tables. */
export interface BlobRow<T = any> {
  id: string;
  data: T;
}
