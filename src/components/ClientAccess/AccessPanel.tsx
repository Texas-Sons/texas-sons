import React, { useState, useEffect, useCallback } from 'react';
import { apiJson } from '../../api';
import { Trash2, Plus } from 'lucide-react';

/**
 * Who may manage one client's content.
 *
 * Rendered in two places over the same endpoint: the salon owner's own
 * dashboard, and the operator's admin app so he can fix a roster without asking
 * her to. Both are authorized identically — /api/client/:id/access resolves
 * membership per project, and the operator qualifies because he owns it — so
 * one component serves both and there is nothing to keep in sync.
 */

export interface Person {
  id: string;
  email: string;
  role: 'owner' | 'member';
  last_seen_at?: string | null;
}

export function AccessPanel({ projectId }: { projectId: string }) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [you, setYou] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = '/api/client/' + encodeURIComponent(projectId) + '/access';

  const load = useCallback(async () => {
    try {
      const d = await apiJson<{ people: Person[]; you: string }>(base);
      setPeople(d.people);
      setYou(d.you || '');
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiJson(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'member' }),
      });
      setEmail('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (person: Person) => {
    if (!confirm(`Remove ${person.email}? They will not be able to add or change photos.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson(base + '/' + encodeURIComponent(person.id), { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {people === null ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : people.length === 0 ? (
        <p className="text-sm text-stone-500">Nobody has been added yet.</p>
      ) : (
        <ul className="divide-y divide-stone-800/70">
          {people.map(p => (
            <li key={p.id} className="py-3 flex items-center gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <p className="text-stone-200 truncate">{p.email}</p>
                <p className="text-xs text-stone-600">
                  {p.role === 'owner' ? 'Owner' : 'Can manage photos'}
                  {/* Distinguishes "she has not got round to it" from "the
                      address is wrong", which are the only two reasons someone
                      says the dashboard is not working for them. */}
                  {!p.last_seen_at && ' · has not signed in yet'}
                </p>
              </div>
              {p.email.toLowerCase() !== you.toLowerCase() && (
                <button
                  type="button"
                  onClick={() => revoke(p)}
                  disabled={busy}
                  aria-label={'Remove ' + p.email}
                  className="p-2 text-stone-500 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="stylist@gmail.com"
          className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !email.includes('@')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-stone-950 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add
        </button>
      </div>

      <p className="text-xs text-stone-600">
        Access starts the moment they sign in with that Google address. No invitation is sent and
        there is nothing for them to accept.
      </p>
    </div>
  );
}
