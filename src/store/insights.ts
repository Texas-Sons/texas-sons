/**
 * Pure derivations over the event log.
 *
 * Deliberately free of any Supabase or browser import: these are the functions
 * that produce the numbers decisions get made from, so they must be testable in
 * plain Node without a database or a Vite environment. `events.ts` owns the I/O
 * and re-exports everything here.
 *
 * Computed in TypeScript rather than SQL because the volumes are small
 * (hundreds of rows) and a funnel definition worth trusting should be readable
 * and tested, not buried in a database view.
 */

export type EventKind =
  // --- automatic ---
  | 'prospect_found'      // a Maps search returned businesses
  | 'prospect_saved'      // triaged as worth pursuing
  | 'prospect_dismissed'  // triaged out
  | 'assets_gathered'     // real photos/reviews pulled from Places
  | 'intake_created'      // converted to a client record
  | 'demo_generated'      // a blueprint was built
  | 'demo_deployed'       // a live pages.dev URL exists
  | 'intake_link_sent'    // portal link minted
  | 'intake_submitted'    // the client filled the portal in
  | 'domain_attached'     // custom domain live
  | 'invoice_created'
  // --- manual ---
  | 'outreach_sent'       // you actually contacted them
  | 'reply_received'
  | 'converted'           // they said yes
  | 'declined'            // they said no — record why
  | 'site_shipped';

export interface EventInput {
  kind: EventKind;
  intakeId?: string;
  projectId?: string;
  prospectId?: string;
  /** Business category. Denormalised so funnel-by-vertical needs no joins. */
  vertical?: string;
  data?: Record<string, any>;
}

export interface StoredEvent extends EventInput {
  id: string;
  createdAt: string;
}

// --- derived views ----------------------------------------------------------
// Computed in the client rather than SQL: the volumes are small (hundreds of
// rows), and keeping the funnel definition in TypeScript means it is readable
// and testable rather than buried in a view.

export interface FunnelStage {
  kind: EventKind;
  label: string;
  count: number;
}

/** Ordered pipeline stages. Drop-off between two rows is where deals die. */
export const FUNNEL_ORDER: Array<{ kind: EventKind; label: string }> = [
  { kind: 'prospect_saved',  label: 'Prospects saved' },
  { kind: 'assets_gathered', label: 'Assets gathered' },
  { kind: 'intake_created',  label: 'Client created' },
  { kind: 'demo_deployed',   label: 'Demo deployed' },
  { kind: 'outreach_sent',   label: 'Outreach sent' },
  { kind: 'reply_received',  label: 'Replied' },
  { kind: 'converted',       label: 'Converted' },
];

export function buildFunnel(events: StoredEvent[], vertical?: string): FunnelStage[] {
  const scoped = vertical ? events.filter(e => e.vertical === vertical) : events;
  return FUNNEL_ORDER.map(stage => ({
    ...stage,
    // Unique subjects, not raw event count — regenerating a demo three times
    // for one client is one client, not three.
    count: new Set(
      scoped
        .filter(e => e.kind === stage.kind)
        .map(e => e.intakeId || e.prospectId || e.projectId || e.id)
    ).size,
  }));
}

/** Conversion rate per vertical — the "stop cold-emailing restaurants" number. */
export function conversionByVertical(events: StoredEvent[]): Array<{
  vertical: string;
  reached: number;
  converted: number;
  rate: number;
}> {
  const verticals = [...new Set(events.map(e => e.vertical).filter(Boolean))] as string[];

  return verticals
    .map(vertical => {
      const scoped = events.filter(e => e.vertical === vertical);
      const subjects = (kind: EventKind) =>
        new Set(scoped.filter(e => e.kind === kind).map(e => e.intakeId || e.prospectId || e.id));

      const reached = subjects('outreach_sent').size;
      const converted = subjects('converted').size;
      return { vertical, reached, converted, rate: reached ? converted / reached : 0 };
    })
    .sort((a, b) => b.rate - a.rate);
}

/** Median days from first sighting to a live site, per completed client. */
export function medianDaysToLive(events: StoredEvent[]): number | null {
  const firstSeen = new Map<string, number>();
  const wentLive = new Map<string, number>();

  // Sort explicitly rather than assuming the caller's order. This previously
  // did `[...events].reverse()`, which only worked because listEvents happens
  // to return newest-first — any other caller silently got "first seen" from
  // the most recent event and produced negative or nonsense spans.
  const chronological = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const e of chronological) {
    const subject = e.intakeId || e.prospectId;
    if (!subject) continue;
    const t = new Date(e.createdAt).getTime();
    if (!firstSeen.has(subject)) firstSeen.set(subject, t);
    if (e.kind === 'site_shipped' || e.kind === 'domain_attached') {
      if (!wentLive.has(subject)) wentLive.set(subject, t);
    }
  }

  const spans = [...wentLive.entries()]
    .map(([subject, live]) => {
      const start = firstSeen.get(subject);
      return start ? (live - start) / 86_400_000 : null;
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  if (!spans.length) return null;
  const mid = Math.floor(spans.length / 2);
  return spans.length % 2 ? spans[mid] : (spans[mid - 1] + spans[mid]) / 2;
}

/**
 * Researched but never contacted — prospects you spent Places quota enriching
 * and then dropped. Usually the largest single leak in a solo pipeline.
 */
export function researchedNotContacted(events: StoredEvent[]): number {
  const gathered = new Set(
    events.filter(e => e.kind === 'assets_gathered').map(e => e.prospectId || e.intakeId).filter(Boolean)
  );
  const contacted = new Set(
    events.filter(e => e.kind === 'outreach_sent').map(e => e.prospectId || e.intakeId).filter(Boolean)
  );
  return [...gathered].filter(id => !contacted.has(id as string)).length;
}
