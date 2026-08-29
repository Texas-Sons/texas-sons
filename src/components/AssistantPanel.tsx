import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, ChevronDown, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';
import {
  listEvents, buildFunnel, conversionByVertical, medianDaysToLive,
  researchedNotContacted,
} from '../store';

/**
 * The business assistant.
 *
 * A model knows nothing about Texas Sons on its own, so every message carries
 * a compact summary of the event log alongside the operating-manual files the
 * server loads. Without that it would give generic web-agency advice; with it,
 * it can answer "which vertical should I focus on" from real numbers.
 *
 * The summary is deliberately small — counts and rates, never raw event rows —
 * so a long conversation does not grow the prompt without bound.
 */

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelChoice {
  id: string;
  label: string;
  hint: string;
  detail: string;
}

const STORAGE_KEY_MODEL = 'txsons_assistant_model';

const STARTERS = [
  'What should I focus on this week?',
  'Which vertical is actually converting?',
  'Where am I losing deals?',
  'What am I not using that I should be?',
];

export default function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<ModelChoice[]>([]);
  const [modelId, setModelId] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY_MODEL) || ''; } catch { return ''; }
  });
  const [openRouterReady, setOpenRouterReady] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showModels, setShowModels] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [spend, setSpend] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);

  // Refetch every time the panel opens rather than caching for the session.
  // Server config is read once at boot, so restarting the server after editing
  // .env.local must be enough to fix the picker — previously a stale first
  // answer stuck until a full page reload, which is a confusing way to find out
  // your key is fine and only the server was old.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/assistant/models');
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.error || 'Could not read model config');
        setChoices(data.choices || []);
        setOpenRouterReady(!!data.openRouterConfigured);
        setConfigError(null);
        if (!modelId && data.default) setModelId(data.default);
      } catch (err: any) {
        if (cancelled) return;
        // Surfaced rather than swallowed — silently showing an empty or wrong
        // picker is how this bug hid in the first place.
        setConfigError(err?.message || 'Could not load the model list.');
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const chooseModel = (id: string) => {
    setModelId(id);
    setShowModels(false);
    try { localStorage.setItem(STORAGE_KEY_MODEL, id); } catch {}
  };

  /** Counts and rates only — never raw rows. Keeps the prompt small. */
  const buildStats = async () => {
    const events = await listEvents(1000);
    if (!events.length) return { note: 'No activity recorded yet.' };
    return {
      funnel: buildFunnel(events).map(s => ({ stage: s.label, businesses: s.count })),
      conversionByVertical: conversionByVertical(events).map(v => ({
        vertical: v.vertical,
        contacted: v.reached,
        won: v.converted,
        rate: `${Math.round(v.rate * 100)}%`,
      })),
      medianDaysProspectToLive: medianDaysToLive(events),
      researchedButNeverContacted: researchedNotContacted(events),
      totalEventsRecorded: events.length,
    };
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const stats = await buildStats();
      const res = await apiFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, stats, model: modelId || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || `Request failed (${res.status})`);

      setMessages([...next, { role: 'assistant', content: data.reply }]);
      setLastUsed(data.model || null);
      if (typeof data.usage?.costUsd === 'number') setSpend(s => s + data.usage.costUsd);
    } catch (err: any) {
      // Surfaced, not swallowed: a silent failure here looks like the assistant
      // ignoring you.
      setError(err.message || 'Could not reach the assistant.');
      setMessages(next);
    } finally {
      setSending(false);
    }
  };

  const activeChoice = choices.find(c => c.id === modelId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Ask about your business"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-2xl shadow-black/50 flex items-center justify-center transition-all hover:scale-105"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[26rem] bg-stone-950 border-l border-stone-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-stone-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Business Assistant
          </h2>
          <button
            onClick={() => setShowModels(v => !v)}
            className="mt-1 text-xs text-stone-500 hover:text-stone-300 flex items-center gap-1 transition-colors"
          >
            {activeChoice?.label || 'Default model'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showModels ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-200 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Model picker */}
      {showModels && (
        <div className="border-b border-stone-800 bg-stone-900/50 p-2 space-y-1">
          {configError && (
            <p className="text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-2 mb-1">
              {configError}
            </p>
          )}
          {choices.map(c => {
            const unavailable = c.id.startsWith('openrouter:') && !openRouterReady;
            return (
              <button
                key={c.id}
                disabled={unavailable}
                onClick={() => chooseModel(c.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                  c.id === modelId
                    ? 'bg-amber-950/40 border-amber-800'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                } ${unavailable ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-bold text-stone-200">{c.label}</span>
                  <span className="text-[10px] font-mono text-stone-500 shrink-0">{c.hint}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {unavailable
                    ? 'Server reports no OPENROUTER_API_KEY. If it is in .env.local, restart the dev server — env is read once at boot.'
                    : c.detail}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-stone-500">
              Ask about your pipeline. Every answer is grounded in your event log and the
              files in <code className="text-stone-400">context/</code> — not generic advice.
            </p>
            <div className="space-y-1.5 pt-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl p-3 whitespace-pre-wrap break-words ${
              m.role === 'user'
                ? 'bg-stone-800 text-stone-100 ml-6'
                : 'bg-stone-900 border border-stone-800 text-stone-300 mr-2'
            }`}
          >
            {m.content}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-stone-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="Ask about your pipeline…"
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-600 resize-none"
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {lastUsed && (
          <p className="text-[10px] text-stone-600 mt-1.5 font-mono truncate">
            {lastUsed}
            {spend > 0 && ` · $${spend.toFixed(4)} this session`}
          </p>
        )}
      </div>
    </div>
  );
}
