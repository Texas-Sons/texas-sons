import { supabase } from '../supabase';
import { getOwnerId, readCache, writeCache } from './core';

export interface IntakeSubmission {
  id: string;
  intake_id: string;
  payload: any;
  reviewed: boolean;
  created_at: string;
}

const CACHE_KEY = 'txsons_intake_submissions';

export async function listSubmissions(): Promise<IntakeSubmission[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return readCache<IntakeSubmission[]>(CACHE_KEY, []);

  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[store] Submissions read failed, serving cache:', error);
    return readCache<IntakeSubmission[]>(CACHE_KEY, []);
  }

  writeCache(CACHE_KEY, data || []);
  return data || [];
}

export async function markSubmissionReviewed(id: string): Promise<void> {
  const cached = readCache<IntakeSubmission[]>(CACHE_KEY, []);
  writeCache(
    CACHE_KEY,
    cached.map(s => (s.id === id ? { ...s, reviewed: true } : s))
  );

  const { error } = await supabase
    .from('intake_submissions')
    .update({ reviewed: true })
    .eq('id', id);

  if (error) {
    console.error('[store] Submission update failed:', error);
    throw new Error(error.message || 'Could not update submission.');
  }
}
