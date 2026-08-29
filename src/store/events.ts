import { supabase } from '../supabase';
import { getOwnerId, readCache, writeCache } from './core';
import type { EventKind, EventInput, StoredEvent } from './insights';

/**
 * The event log — what happened, when.
 *
 * Every other repo stores current state. This one stores history, because the
 * questions worth answering are all historical: which verticals convert, how
 * long a build actually takes, which outreach gets replies, where deals die.
 *
 * Append-only. Nothing here updates or deletes.
 */

const QUEUE_CACHE_KEY = 'txsons_event_queue';

function toRow(event: EventInput, ownerId: string) {
  return {
    owner_id: ownerId,
    kind: event.kind,
    intake_id: event.intakeId ?? null,
    project_id: event.projectId ?? null,
    prospect_id: event.prospectId ?? null,
    vertical: event.vertical ?? null,
    data: event.data ?? {},
  };
}

function fromRow(row: any): StoredEvent {
  return {
    id: row.id,
    kind: row.kind,
    intakeId: row.intake_id ?? undefined,
    projectId: row.project_id ?? undefined,
    prospectId: row.prospect_id ?? undefined,
    vertical: row.vertical ?? undefined,
    data: row.data ?? {},
    createdAt: row.created_at,
  };
}

/**
 * Records an event. Fire-and-forget: never awaited by callers, never throws.
 *
 * This is the one deliberate exception to the "never swallow a write failure"
 * rule in AGENTS.md. That rule exists because a failed save of a client's
 * details is data loss the user must know about. Analytics is different: if
 * recording "demo deployed" fails, the deploy still happened and the user must
 * not see an error about it. Losing a row costs a slightly wrong funnel;
 * blocking a deploy on a telemetry write costs real work.
 *
 * Failures are queued locally and retried on the next successful record, so a
 * brief outage skews the log rather than silently erasing it.
 */
export function recordEvent(event: EventInput): void {
  void (async () => {
    try {
      const ownerId = await getOwnerId();
      if (!ownerId) return; // signed out — nothing to attribute it to

      const queued = readCache<EventInput[]>(QUEUE_CACHE_KEY, []);
      const batch = [...queued, event].map(e => toRow(e, ownerId));

      const { error } = await supabase.from('events').insert(batch);
      if (error) throw error;

      if (queued.length) writeCache(QUEUE_CACHE_KEY, []);
    } catch (error) {
      console.warn('[events] Could not record, queued for retry:', error);
      try {
        const queued = readCache<EventInput[]>(QUEUE_CACHE_KEY, []);
        // Bounded so a long outage cannot fill localStorage.
        writeCache(QUEUE_CACHE_KEY, [...queued, event].slice(-50));
      } catch {}
    }
  })();
}

/** Recent events, newest first. */
export async function listEvents(limit = 500): Promise<StoredEvent[]> {
  const ownerId = await getOwnerId();
  if (!ownerId) return [];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[events] Read failed:', error);
    return [];
  }
  return (data || []).map(fromRow);
}

// Derived views live in insights.ts so they stay testable without a database.
export * from './insights';
