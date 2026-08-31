import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import { apiJson } from '../../api';
import { MediaManager, type MediaApi, type MediaKind } from '../ClientPortal/MediaManager';
import { AccessPanel } from '../ClientAccess/AccessPanel';
import TexasSonsLogo from '../TexasSonsLogo';
import {
  Loader2, AlertCircle, LogOut, Images, Globe, Users, ExternalLink,
} from 'lucide-react';

/**
 * The signed-in client dashboard — /dashboard.
 *
 * The other way into the same content as /portal/<token>, and the only one that
 * can answer "who else may edit this". A shared link cannot be revoked for one
 * stylist without revoking it for everyone, and cannot say who uploaded what.
 *
 * Authorization is entirely the server's business. This component asks for a
 * list of projects and is told which ones exist for this session; asking for one
 * it was not told about returns the same 404 as one that does not exist. Nothing
 * here is a security boundary and nothing here should be treated as one.
 */

interface ClientProject {
  id: string;
  name: string;
  role: 'owner' | 'member';
}

interface SiteInfo {
  name?: string;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  tagline?: string;
  bookingUrl?: string;
  services?: Array<{ title?: string; price?: string; description?: string }>;
}

type Tab = 'photos' | 'site' | 'access';

export default function ClientDashboard() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const [projects, setProjects] = useState<ClientProject[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('photos');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProjects(null); return; }
    let live = true;
    apiJson<{ projects: ClientProject[] }>('/api/client/projects')
      .then(data => {
        if (!live) return;
        setProjects(data.projects);
        setActiveId(prev => prev || data.projects[0]?.id || null);
      })
      .catch(err => { if (live) setLoadError(err.message); });
    return () => { live = false; };
  }, [session]);

  const active = projects?.find(p => p.id === activeId) || null;

  // Memoised on the project id. MediaManager reloads whenever this identity
  // changes, which is exactly right when switching salons and wrong on every
  // unrelated re-render.
  const api = useMemo<MediaApi>(() => {
    const base = '/api/client/' + encodeURIComponent(activeId || '');
    return {
      list: async () => (await apiJson(base + '/media')).media || [],
      add: async (kind: MediaKind, data, sortOrder) =>
        (await apiJson(base + '/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, data, sortOrder }),
        })).id,
      remove: async (id: string) => {
        await apiJson(base + '/media/' + encodeURIComponent(id), { method: 'DELETE' });
      },
    };
  }, [activeId]);

  const signIn = async () => {
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    if (error) { setLoadError(error.message); setSigningIn(false); }
  };

  if (checkingSession) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Checking your sign-in…</span>
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <div className="max-w-sm w-full text-center space-y-6">
          <TexasSonsLogo className="h-10 w-auto mx-auto opacity-80" />
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-stone-100">Your salon dashboard</h1>
            <p className="text-sm text-stone-400">
              Sign in to manage your photos, see what is on your website, and choose who else can help.
            </p>
          </div>
          <button
            type="button"
            onClick={signIn}
            disabled={signingIn}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-stone-950 font-bold disabled:opacity-50"
          >
            {signingIn ? 'Opening Google…' : 'Continue with Google'}
          </button>
          {loadError && <p className="text-xs text-red-400">{loadError}</p>}
          <p className="text-xs text-stone-600">
            Use the email address your salon was set up with. If you are not sure, ask whoever sent you this link.
          </p>
        </div>
      </Shell>
    );
  }

  if (projects && projects.length === 0) {
    return (
      <Shell>
        <div className="max-w-sm text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-400" aria-hidden="true" />
          <h1 className="text-lg font-bold text-stone-100">No salon is linked to this address</h1>
          <p className="text-sm text-stone-400">
            You are signed in as <span className="text-stone-200">{session.user?.email}</span>, but nobody has
            given that address access yet.
          </p>
          {/* Say which address failed, because the usual cause is signing in
              with a personal Google account rather than the one that was added. */}
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-amber-400 underline">
            Sign in with a different account
          </button>
        </div>
      </Shell>
    );
  }

  if (!projects) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Loading your salon…</span>
        </div>
      </Shell>
    );
  }

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ['photos', 'Photos', <Images key="i" className="w-4 h-4" aria-hidden="true" />],
    ['site', 'Your site', <Globe key="g" className="w-4 h-4" aria-hidden="true" />],
    ...(active?.role === 'owner'
      ? [['access', 'Access', <Users key="u" className="w-4 h-4" aria-hidden="true" />] as [Tab, string, React.ReactNode]]
      : []),
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-24">
      <header className="border-b border-stone-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold truncate">{active?.name || 'Your salon'}</h1>
            <p className="text-xs text-stone-500 truncate">{session.user?.email}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-stone-500 hover:text-stone-200"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {projects.length > 1 && (
          <div className="max-w-3xl mx-auto mt-3">
            <select
              value={activeId || ''}
              onChange={e => setActiveId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-sm"
              aria-label="Choose a salon"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <nav className="max-w-3xl mx-auto mt-4 flex gap-1">
          {tabs.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === id ? 'bg-stone-800 text-stone-100' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loadError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Keyed on the salon so switching gives a clean mount. Without it, a
            half-filled before/after pair would follow you from one salon to the
            next and get saved against the wrong one. */}
        {activeId && tab === 'photos' && (
          <React.Fragment key={activeId}>
            <MediaManager api={api} />
          </React.Fragment>
        )}
        {activeId && tab === 'site' && <SitePanel projectId={activeId} />}
        {activeId && tab === 'access' && <AccessPanel projectId={activeId} />}
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">{children}</div>
  );
}

/**
 * What is currently published. Read-only on purpose: the operator owns the
 * blueprint, and two writers on one object is how the Studio silently deleted a
 * server-side edit. She sees what is live and asks for changes.
 */
function SitePanel({ projectId }: { projectId: string }) {
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    apiJson<{ site: SiteInfo }>('/api/client/' + encodeURIComponent(projectId) + '/site')
      .then(d => { if (live) setSite(d.site); })
      .catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [projectId]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!site) return <p className="text-sm text-stone-500">Loading…</p>;

  const rows: Array<[string, string | undefined]> = [
    ['Phone', site.phone],
    ['Email', site.email],
    ['Address', site.address],
    ['Hours', site.hours],
    ['Tagline', site.tagline],
  ];

  return (
    <div className="space-y-6">
      {site.domain && (
        <a
          href={site.domain}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-amber-400"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          View your live website
        </a>
      )}

      <section className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 space-y-3">
        <h2 className="font-bold">Your details</h2>
        <dl className="divide-y divide-stone-800/70">
          {rows.map(([label, value]) => (
            <div key={label} className="py-2.5 flex gap-4 text-sm">
              <dt className="w-24 flex-shrink-0 text-stone-500">{label}</dt>
              <dd className={value ? 'text-stone-200' : 'text-stone-600 italic'}>
                {value || 'Not set'}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-stone-600">
          Something wrong here? Reply to whoever set up your site and it will be corrected — these
          details are managed for you, so nothing on this tab can be edited by mistake.
        </p>
      </section>

      {!!site.services?.length && (
        <section className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 space-y-3">
          <h2 className="font-bold">Services on your site</h2>
          <ul className="divide-y divide-stone-800/70">
            {site.services.map((s, i) => (
              <li key={i} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
                <span className="text-stone-200">{s.title}</span>
                <span className="text-stone-400 flex-shrink-0">{s.price}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-600">
            These are shown to customers. If a price has changed, say so and it will be updated.
          </p>
        </section>
      )}
    </div>
  );
}
