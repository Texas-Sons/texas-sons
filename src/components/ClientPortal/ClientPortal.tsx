import React, { useState, useEffect, useMemo } from 'react';
import { MediaManager, type MediaApi, type MediaKind } from './MediaManager';
import TexasSonsLogo from '../TexasSonsLogo';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * The token portal — /portal/<token>.
 *
 * Distinct from IntakePortal, which is filled in once before a site is built.
 * This one is permanent: it is how a salon owner keeps her portfolio current for
 * as long as the site is live, without going through the operator for every
 * photo.
 *
 * Authenticated by an unguessable link and nothing else, which is its whole
 * point: it works the minute it is sent, and asks her to create no account. The
 * signed-in dashboard at /dashboard is the other way in, and the only one that
 * can grant a stylist access and revoke it again. Both exist deliberately.
 *
 * All the actual editing lives in MediaManager. This file is the transport and
 * nothing else — everything it knows is a token in the URL.
 */

export default function ClientPortal() {
  const [token, setToken] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.location.pathname.split('/').filter(Boolean).pop() || '';
    setToken(t);

    fetch('/api/portal/' + encodeURIComponent(t))
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error || 'This link is no longer active.');
        setBusinessName(data.businessName || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Memoised on the token: MediaManager loads on identity change, so a fresh
  // object each render would refetch forever.
  const api = useMemo<MediaApi>(() => {
    const base = '/api/portal/' + encodeURIComponent(token);
    const unwrap = async (res: Response) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong. Please try again.');
      return json;
    };
    return {
      list: async () => (await unwrap(await fetch(base))).media || [],
      add: async (kind: MediaKind, data, sortOrder) =>
        (await unwrap(await fetch(base + '/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, data, sortOrder }),
        }))).id,
      remove: async (id: string) => {
        await unwrap(await fetch(base + '/media/' + encodeURIComponent(id), { method: 'DELETE' }));
      },
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        <span className="ml-3">Loading your content…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-400" aria-hidden="true" />
          <h1 className="text-xl font-bold">This link is not active</h1>
          <p className="text-sm text-stone-400">{error}</p>
          <p className="text-xs text-stone-500">Ask for a fresh link and this page will work again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <header className="border-b border-stone-800 px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold">{businessName || 'Your content'}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Add your own photos. They go live on your website automatically.
            </p>
          </div>
          <TexasSonsLogo className="h-8 w-auto opacity-60 flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <MediaManager api={api} />
      </main>
    </div>
  );
}
