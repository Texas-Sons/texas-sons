import React, { useState } from 'react';
import { Images, Copy, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

/**
 * Generates and copies a client's content-portal link.
 *
 * The route to mint one has existed since f185d2e with no way to reach it from
 * the app, which meant the only way to give a client access was to hand-craft a
 * POST. A capability nobody can invoke is not a feature.
 *
 * The link is the entire authentication. Anyone holding it can add and remove
 * photos on that client's live site, so it is generated on demand rather than
 * minted for every project up front, and revoking is one click away.
 */

export interface PortalLinkButtonProps {
  projectId: string;
  /** Existing token, when the caller already knows one. */
  token?: string | null;
  onTokenChange?: (token: string | null) => void;
}

export function PortalLinkButton({ projectId, token: initialToken, onTokenChange }: PortalLinkButtonProps) {
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = token ? `${window.location.origin}/portal/${token}` : '';

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portal-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not create the link.');
      setToken(data.token);
      onTokenChange?.(data.token);

      // Straight to the clipboard: the only thing anyone does with a fresh link
      // is send it, and a link you have to select out of a card is a link that
      // gets sent truncated.
      await navigator.clipboard.writeText(`${window.location.origin}/portal/${data.token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy. Select the link and copy it manually.');
    }
  };

  const revoke = async () => {
    if (!confirm('Revoke this link? She will not be able to add or change photos until you send a new one.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portal-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, revoke: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not revoke the link.');
      setToken(null);
      onTokenChange?.(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const chip =
    'flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  if (!token) {
    return (
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        title="Create a link she can use to add her own photos"
        className={`${chip} text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700`}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Images className="w-3.5 h-3.5" />}
        Photo link
        {error && <span className="sr-only">{error}</span>}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={copy}
        title={url}
        className={`${chip} text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/60`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Photo link'}
      </button>
      <button
        type="button"
        onClick={revoke}
        disabled={busy}
        title="Revoke this link"
        className="p-1 text-stone-600 hover:text-red-400 rounded transition-colors"
      >
        ×
      </button>
    </span>
  );
}
