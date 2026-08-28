import { supabase } from '../supabase';

/**
 * Inbound leads from deployed client sites.
 *
 * Read-only from the Studio's perspective — writes come from ClientApp on the
 * live sites, which post to /api/lead without a session. `leads` is the one
 * table with a public insert path, so it has no owner column to scope by.
 */

export async function countLeads(): Promise<number> {
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn('[store] Lead count failed:', error);
    return 0;
  }
  return count ?? 0;
}
