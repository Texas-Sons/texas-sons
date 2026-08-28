import { supabase } from '../supabase';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * Studio working state — the in-progress project and its generation history.
 *
 * These are written on every edit in the Studio, so unlike the other repos the
 * saves are debounced. Without that, dragging a color picker would fire a
 * database write per frame. localStorage is still written synchronously on every
 * change, so a hard refresh mid-edit loses nothing.
 */

const CURRENT_CACHE_KEY = 'txsons_studio_project';
const HISTORY_CACHE_KEY = 'txsons_studio_history';

const SAVE_DEBOUNCE_MS = 1500;

export type Snapshot = Record<string, any>;

function rowId(kind: 'current' | 'history', ownerId: string): string {
  return `${kind}:${ownerId}`;
}

// --- reads ------------------------------------------------------------------

export async function loadCurrentProject(): Promise<Snapshot | null> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Snapshot | null>(CURRENT_CACHE_KEY, null);

  const { data, error } = await supabase
    .from('studio_snapshots')
    .select('data')
    .eq('id', rowId('current', ownerId))
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('[store] Studio project read failed, serving cache:', error);
    return readCache<Snapshot | null>(CURRENT_CACHE_KEY, null);
  }

  writeCache(CURRENT_CACHE_KEY, data.data);
  return data.data as Snapshot;
}

export async function loadHistory(): Promise<Snapshot[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<Snapshot[]>(HISTORY_CACHE_KEY, []);

  const { data, error } = await supabase
    .from('studio_snapshots')
    .select('data')
    .eq('id', rowId('history', ownerId))
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('[store] Studio history read failed, serving cache:', error);
    return readCache<Snapshot[]>(HISTORY_CACHE_KEY, []);
  }

  const items = (data.data as any)?.items;
  if (!Array.isArray(items)) return readCache<Snapshot[]>(HISTORY_CACHE_KEY, []);

  writeCache(HISTORY_CACHE_KEY, items);
  return items;
}

// --- debounced writes -------------------------------------------------------

const timers: Record<string, ReturnType<typeof setTimeout>> = {};

function debounce(key: string, fn: () => void) {
  if (timers[key]) clearTimeout(timers[key]);
  timers[key] = setTimeout(fn, SAVE_DEBOUNCE_MS);
}

async function upsertSnapshot(kind: 'current' | 'history', data: unknown): Promise<void> {
  const ownerId = await requireOwnerId();
  const { error } = await supabase.from('studio_snapshots').upsert({
    id: rowId(kind, ownerId),
    owner_id: ownerId,
    kind,
    data,
  });
  if (error) console.error(`[store] Studio ${kind} save failed:`, error);
}

/** Caches immediately; persists to Supabase after the edit burst settles. */
export function saveCurrentProject(project: Snapshot): void {
  writeCache(CURRENT_CACHE_KEY, project);
  debounce('current', () => {
    void upsertSnapshot('current', project);
  });
}

export function saveHistory(history: Snapshot[]): void {
  writeCache(HISTORY_CACHE_KEY, history);
  debounce('history', () => {
    void upsertSnapshot('history', { items: history });
  });
}

/** Forces any pending debounced writes to run now — call before sign-out. */
export async function flushStudioState(): Promise<void> {
  for (const key of Object.keys(timers)) {
    clearTimeout(timers[key]);
    delete timers[key];
  }
  const project = readCache<Snapshot | null>(CURRENT_CACHE_KEY, null);
  const history = readCache<Snapshot[]>(HISTORY_CACHE_KEY, []);
  try {
    if (project) await upsertSnapshot('current', project);
    if (history.length) await upsertSnapshot('history', { items: history });
  } catch (error) {
    console.warn('[store] Could not flush studio state:', error);
  }
}

export function cachedCurrentProject(): Snapshot | null {
  return readCache<Snapshot | null>(CURRENT_CACHE_KEY, null);
}

export function cachedHistory(): Snapshot[] {
  return readCache<Snapshot[]>(HISTORY_CACHE_KEY, []);
}
