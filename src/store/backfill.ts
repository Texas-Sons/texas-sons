import { supabase } from '../supabase';
import { getOwnerId, readCache } from './core';

/**
 * One-time migration of browser-local data into Supabase.
 *
 * Everything the Studio built before Phase 1 lives only in this browser. This
 * runs once on first authenticated load and pushes it up.
 *
 * Safety rules, in order of importance:
 *   1. NEVER delete local data. The cache stays exactly as it is; if the upload
 *      fails, nothing is lost and the next load retries.
 *   2. Skip any entity that already has rows in Supabase — that means it has
 *      been migrated (here or on another device) and re-running would clobber
 *      newer server data with stale local copies.
 *   3. Record completion per-entity, so a partial failure resumes rather than
 *      restarting from scratch.
 */

const DONE_KEY = 'txsons_backfill_completed';

interface BackfillReport {
  blueprints: number;
  intakes: number;
  prospects: number;
  dismissed: number;
  settings: number;
  studio: number;
  skipped: string[];
  errors: string[];
}

function loadDone(): string[] {
  return readCache<string[]>(DONE_KEY, []);
}

function markDone(entity: string) {
  const done = loadDone();
  if (!done.includes(entity)) {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify([...done, entity]));
    } catch {}
  }
}

/** True when the table already holds at least one row for this owner. */
async function alreadyPopulated(table: string, ownerId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId);
  if (error) {
    // Can't confirm it's empty, so don't risk overwriting. Treat as populated.
    console.warn(`[backfill] Could not inspect ${table}, skipping to be safe:`, error);
    return true;
  }
  return (count ?? 0) > 0;
}

export async function runBackfill(): Promise<BackfillReport | null> {
  const ownerId = await getOwnerId();
  if (!ownerId) return null;

  const done = loadDone();
  const report: BackfillReport = {
    blueprints: 0, intakes: 0, prospects: 0, dismissed: 0, settings: 0, studio: 0,
    skipped: [], errors: [],
  };

  async function migrate(
    entity: string,
    table: string,
    build: () => any[]
  ): Promise<number> {
    if (done.includes(entity)) return 0;

    const rows = build();
    if (!rows.length) {
      markDone(entity);
      return 0;
    }

    if (await alreadyPopulated(table, ownerId!)) {
      report.skipped.push(entity);
      markDone(entity);
      return 0;
    }

    const { error } = await supabase.from(table).upsert(rows);
    if (error) {
      console.error(`[backfill] ${entity} failed:`, error);
      report.errors.push(`${entity}: ${error.message}`);
      return 0; // not marked done — retried next load
    }

    markDone(entity);
    return rows.length;
  }

  // --- blueprints ---
  report.blueprints = await migrate('blueprints', 'blueprints', () =>
    readCache<any[]>('txsons_custom_blueprints', [])
      .filter(b => b?.id)
      .map(b => ({
        id: b.id,
        owner_id: ownerId,
        name: b.profile?.name || b.title || 'Untitled blueprint',
        data: b,
      }))
  );

  // --- client intakes ---
  report.intakes = await migrate('intakes', 'client_intakes', () =>
    readCache<any[]>('txsons_client_intakes', [])
      .filter(c => c?.id)
      .map(c => ({
        id: c.id,
        owner_id: ownerId,
        business_name: c.businessName,
        client_contact: c.clientContact,
        email: c.email,
        phone: c.phone,
        address: c.address,
        domain: c.domain,
        category: c.category,
        tier: c.tier,
        status: c.status,
        theme: c.theme,
        tagline: c.tagline,
        description: c.description,
        data: c,
      }))
  );

  // --- saved prospects + dismissals (same table, different status) ---
  report.prospects = await migrate('prospects', 'prospects', () =>
    readCache<any[]>('txsons_saved_leads', [])
      .filter(p => p?.id)
      .map(p => ({ id: p.id, owner_id: ownerId, status: 'saved', data: p }))
  );

  // Dismissals go through a separate marker so a saved-prospect failure does not
  // block them, but they share the table — hence the populated check is skipped
  // here and upsert handles collisions.
  if (!done.includes('dismissed')) {
    const ids = readCache<string[]>('txsons_dismissed_places', []).filter(Boolean);
    if (ids.length) {
      const { error } = await supabase.from('prospects').upsert(
        ids.map(id => ({ id, owner_id: ownerId, status: 'dismissed', data: {} })),
        { ignoreDuplicates: true }
      );
      if (error) {
        report.errors.push(`dismissed: ${error.message}`);
      } else {
        report.dismissed = ids.length;
        markDone('dismissed');
      }
    } else {
      markDone('dismissed');
    }
  }

  // --- settings ---
  if (!done.includes('settings')) {
    const settings = readCache<Record<string, any> | null>('txsons_studio_settings', null);
    if (settings && Object.keys(settings).length) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ owner_id: ownerId, data: settings });
      if (error) report.errors.push(`settings: ${error.message}`);
      else {
        report.settings = 1;
        markDone('settings');
      }
    } else {
      markDone('settings');
    }
  }

  // --- studio working state ---
  if (!done.includes('studio')) {
    const current = readCache<any>('txsons_studio_project', null);
    const history = readCache<any[]>('txsons_studio_history', []);
    const rows: any[] = [];
    if (current) rows.push({ id: `current:${ownerId}`, owner_id: ownerId, kind: 'current', data: current });
    if (history.length) rows.push({ id: `history:${ownerId}`, owner_id: ownerId, kind: 'history', data: { items: history } });

    if (rows.length) {
      const { error } = await supabase.from('studio_snapshots').upsert(rows);
      if (error) report.errors.push(`studio: ${error.message}`);
      else {
        report.studio = rows.length;
        markDone('studio');
      }
    } else {
      markDone('studio');
    }
  }

  const moved =
    report.blueprints + report.intakes + report.prospects +
    report.dismissed + report.settings + report.studio;

  if (moved > 0 || report.errors.length > 0) {
    console.info('[backfill] Local data migration:', report);
  }

  return report;
}

/** Lets Settings offer a re-run after a failure. */
export function resetBackfillMarker(): void {
  try {
    localStorage.removeItem(DONE_KEY);
  } catch {}
}
