import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2,
  XCircle, MessageSquare, Loader2, Target, Inbox,
} from 'lucide-react';
import {
  listEvents, recordEvent, buildFunnel, conversionByVertical,
  medianDaysToLive, researchedNotContacted, listIntakes,
  type StoredEvent,
} from '../store';
import { ClientIntake } from '../types';

/**
 * What's working and what isn't.
 *
 * Every number here comes from the event log. Nothing is estimated, seeded, or
 * inferred — if the log has no data for something, this says so rather than
 * showing a plausible-looking figure. The Settings usage panel used to invent
 * its numbers, which is worse than showing none.
 */

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** Prompts for outcomes only the operator can know. */
function OutcomePrompt({
  clients,
  events,
  onLogged,
}: {
  clients: ClientIntake[];
  events: StoredEvent[];
  onLogged: () => void;
}) {
  // A client is "awaiting an outcome" once contacted with nothing recorded since.
  const awaiting = useMemo(() => {
    const contacted = new Set(
      events.filter(e => e.kind === 'outreach_sent').map(e => e.intakeId).filter(Boolean)
    );
    const resolved = new Set(
      events
        .filter(e => ['reply_received', 'converted', 'declined'].includes(e.kind))
        .map(e => e.intakeId)
        .filter(Boolean)
    );
    return clients.filter(c => contacted.has(c.id) && !resolved.has(c.id));
  }, [clients, events]);

  const log = (client: ClientIntake, kind: 'reply_received' | 'converted' | 'declined') => {
    let reason: string | undefined;
    if (kind === 'declined') {
      // The reason is the whole point — "too expensive" and "went with a cousin"
      // suggest completely different fixes.
      reason = window.prompt(`Why did ${client.businessName} pass? (price, timing, went elsewhere, no reply…)`) || undefined;
      if (reason === undefined) return; // cancelled
    }
    recordEvent({ kind, intakeId: client.id, vertical: client.category, data: { reason } });
    onLogged();
  };

  if (!awaiting.length) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-stone-800 text-center text-stone-500 text-sm">
        Nothing awaiting an outcome. Every client you've contacted has been resolved.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-500 mb-3">
        These are the only numbers the app can't work out on its own. Without them the
        funnel stops at "contacted" and can't tell you why deals die.
      </p>
      {awaiting.map(client => (
        <div
          key={client.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800"
        >
          <div className="min-w-0">
            <p className="font-bold text-stone-200 truncate">{client.businessName}</p>
            <p className="text-xs text-stone-500">{client.category}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => log(client, 'reply_received')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3" /> Replied
            </button>
            <button
              onClick={() => log(client, 'converted')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 hover:border-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3" /> Won
            </button>
            <button
              onClick={() => log(client, 'declined')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 border border-stone-700 text-stone-400 hover:border-red-800 hover:text-red-300 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3 h-3" /> Passed
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsView() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [clients, setClients] = useState<ClientIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [e, c] = await Promise.all([listEvents(1000), listIntakes()]);
      setEvents(e);
      setClients(c);
      setLoading(false);
    })();
  }, [reloadKey]);

  const funnel = useMemo(() => buildFunnel(events), [events]);
  const verticals = useMemo(() => conversionByVertical(events), [events]);
  const daysToLive = useMemo(() => medianDaysToLive(events), [events]);
  const stranded = useMemo(() => researchedNotContacted(events), [events]);

  const declineReasons = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events.filter(x => x.kind === 'declined')) {
      const reason = (e.data?.reason || 'unspecified').toString().toLowerCase().trim();
      counts.set(reason, (counts.get(reason) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Reading your event log…
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Target className="w-10 h-10 mx-auto text-stone-700 mb-4" />
        <h2 className="text-xl font-bold text-stone-200 mb-2">No history yet</h2>
        <p className="text-stone-500 text-sm">
          Insights are computed from what actually happens as you work — searching for
          prospects, gathering assets, deploying demos, sending outreach. Go run a search
          in Lead Finder and this fills in.
        </p>
        <p className="text-stone-600 text-xs mt-4">
          Nothing here is estimated. An empty log shows nothing rather than a guess.
        </p>
      </div>
    );
  }

  const maxStage = Math.max(...funnel.map(s => s.count), 1);

  return (
    <div className="space-y-8">
      {/* Headline numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-mono mb-2">
            <Clock className="w-3.5 h-3.5" /> MEDIAN PROSPECT → LIVE
          </div>
          <p className="text-3xl font-bold text-stone-100">
            {daysToLive === null ? '—' : `${Math.round(daysToLive)}d`}
          </p>
          <p className="text-xs text-stone-600 mt-1">
            {daysToLive === null ? 'No sites shipped yet' : 'Across shipped sites'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-mono mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> RESEARCHED, NEVER CONTACTED
          </div>
          <p className={`text-3xl font-bold ${stranded > 0 ? 'text-amber-400' : 'text-stone-100'}`}>
            {stranded}
          </p>
          <p className="text-xs text-stone-600 mt-1">
            {stranded > 0 ? 'Maps quota spent, no outreach sent' : 'No stranded research'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-mono mb-2">
            <Inbox className="w-3.5 h-3.5" /> EVENTS RECORDED
          </div>
          <p className="text-3xl font-bold text-stone-100">{events.length}</p>
          <p className="text-xs text-stone-600 mt-1">Since logging began</p>
        </div>
      </div>

      {/* Funnel */}
      <section>
        <h3 className="text-sm font-bold text-stone-300 mb-1">Pipeline</h3>
        <p className="text-xs text-stone-600 mb-4">
          Counts unique businesses, not actions — redeploying one demo three times is
          still one business.
        </p>
        <div className="space-y-2">
          {funnel.map((stage, i) => {
            const prev = i > 0 ? funnel[i - 1].count : null;
            const dropped = prev !== null && prev > 0 ? prev - stage.count : 0;
            return (
              <div key={stage.kind} className="flex items-center gap-3">
                <div className="w-40 shrink-0 text-xs text-stone-400 text-right">{stage.label}</div>
                <div className="flex-1 h-8 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-700/60 to-amber-600/40 transition-all"
                    style={{ width: `${(stage.count / maxStage) * 100}%` }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-stone-200">
                    {stage.count}
                  </span>
                </div>
                <div className="w-28 shrink-0 text-xs text-stone-600">
                  {dropped > 0 && <span className="text-red-400/70">−{dropped} lost</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Conversion by vertical */}
      <section>
        <h3 className="text-sm font-bold text-stone-300 mb-1">Which verticals convert</h3>
        <p className="text-xs text-stone-600 mb-4">
          Of the businesses you contacted, how many said yes.
        </p>
        {verticals.length === 0 ? (
          <p className="text-sm text-stone-600 p-4 border border-dashed border-stone-800 rounded-xl">
            Nothing to compare yet — this needs outreach recorded against at least one vertical.
          </p>
        ) : (
          <div className="space-y-1.5">
            {verticals.map(v => (
              <div
                key={v.vertical}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800"
              >
                <span className="text-sm text-stone-300">{v.vertical}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-stone-600">{v.converted}/{v.reached} contacted</span>
                  <span
                    className={`font-bold font-mono w-12 text-right ${
                      v.rate >= 0.2 ? 'text-emerald-400' : v.rate > 0 ? 'text-amber-400' : 'text-stone-600'
                    }`}
                  >
                    {v.reached === 0 ? '—' : pct(v.rate)}
                  </span>
                  {v.rate >= 0.2 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : v.reached >= 3 && v.rate === 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <span className="w-3.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why deals die */}
      {declineReasons.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-stone-300 mb-4">Why deals died</h3>
          <div className="space-y-1.5">
            {declineReasons.map(([reason, count]) => (
              <div key={reason} className="flex justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 text-sm">
                <span className="text-stone-400">{reason}</span>
                <span className="text-stone-500 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual outcomes */}
      <section>
        <h3 className="text-sm font-bold text-stone-300 mb-3">Awaiting your call</h3>
        <OutcomePrompt
          clients={clients}
          events={events}
          onLogged={() => setTimeout(() => setReloadKey(k => k + 1), 400)}
        />
      </section>
    </div>
  );
}
