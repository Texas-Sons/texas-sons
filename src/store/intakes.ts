import { supabase } from '../supabase';
import { ClientIntake } from '../types';
import { getOwnerId, requireOwnerId, readCache, writeCache } from './core';

/**
 * Client intakes.
 *
 * This table already existed, but the app also kept a parallel copy in
 * localStorage and the two could disagree. Supabase is now the authority; the
 * local copy is a cache.
 *
 * The `data` column holds the whole ClientIntake object. The flat columns
 * alongside it exist so the table stays queryable (and so future automation can
 * filter on status without parsing JSON) — they are derived, not authoritative.
 */

const CACHE_KEY = 'txsons_client_intakes';

function toRow(intake: ClientIntake, ownerId: string) {
  return {
    id: intake.id,
    owner_id: ownerId,
    business_name: intake.businessName,
    client_contact: intake.clientContact,
    email: intake.email,
    phone: intake.phone,
    address: intake.address,
    domain: intake.domain,
    category: intake.category,
    tier: intake.tier,
    status: intake.status,
    theme: intake.theme,
    tagline: intake.tagline,
    description: intake.description,
    data: intake,
    updated_at: new Date().toISOString(),
  };
}

export async function listIntakes(): Promise<ClientIntake[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<ClientIntake[]>(CACHE_KEY, []);

  const { data, error } = await supabase
    .from('client_intakes')
    .select('id, data')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('[store] Intake read failed, serving cache:', error);
    return readCache<ClientIntake[]>(CACHE_KEY, []);
  }

  const intakes = (data || [])
    .map(row => ({ ...(row.data as ClientIntake), id: row.id }))
    .filter(Boolean);

  writeCache(CACHE_KEY, intakes);
  return intakes;
}

export async function saveIntake(intake: ClientIntake): Promise<void> {
  if (!intake?.id) throw new Error('Client intake needs an id before it can be saved.');
  const ownerId = await requireOwnerId();

  const cached = readCache<ClientIntake[]>(CACHE_KEY, []);
  const exists = cached.some(c => c.id === intake.id);
  writeCache(
    CACHE_KEY,
    exists ? cached.map(c => (c.id === intake.id ? intake : c)) : [intake, ...cached]
  );

  const { error } = await supabase.from('client_intakes').upsert(toRow(intake, ownerId));
  if (error) {
    console.error('[store] Intake save failed:', error);
    throw new Error(error.message || 'Could not save the client.');
  }
}

export async function removeIntake(id: string): Promise<void> {
  const ownerId = await requireOwnerId();

  writeCache(
    CACHE_KEY,
    readCache<ClientIntake[]>(CACHE_KEY, []).filter(c => c.id !== id)
  );

  const { error } = await supabase.from('client_intakes').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    console.error('[store] Intake delete failed:', error);
    throw new Error(error.message || 'Could not delete the client.');
  }
}

export function cachedIntakes(): ClientIntake[] {
  return readCache<ClientIntake[]>(CACHE_KEY, []);
}
