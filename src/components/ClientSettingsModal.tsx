import React, { useState } from 'react';
import { apiJson } from '../api';
import { AccessPanel } from './ClientAccess/AccessPanel';
import { PortalLinkButton } from './PortalLinkButton';
import { ServicesEditor, type EditableService } from './ServicesEditor';
import { X, Loader2, UploadCloud, CheckCircle2, AlertTriangle, History } from 'lucide-react';

/**
 * Client-side settings, from the operator's side.
 *
 * Everything about how a client reaches her own content lives here, so managing
 * a salon does not mean leaving the app: the no-account photo link, the roster
 * of people who may sign in, and publishing.
 *
 * Publishing is on this panel because of a gap that is easy to miss and costly
 * when you do. Editing a project's details changes the row in Supabase, and the
 * deployed site does not read Supabase — the blueprint is baked into the HTML at
 * deploy time as window.__TXSONS_BLUEPRINT__. So a corrected phone number sits
 * in the database looking correct while customers still see the old one.
 *
 * Client photo uploads redeploy themselves; operator edits never did. That is
 * backwards, and it is why Opalescent still publishes a number nobody can dial.
 */

export interface ClientSettingsModalProps {
  project: {
    id: string;
    companyName?: string;
    domain?: string;
    blueprint?: any;
    portalToken?: string | null;
  };
  onClose: () => void;
  /**
   * Save a changed blueprint. Never publishes — the operator publishes when
   * they are ready, which is the whole distinction this panel exists to make.
   */
  onRestore?: (blueprint: any) => void | Promise<void>;
}

export function ClientSettingsModal({ project, onClose, onRestore }: ClientSettingsModalProps) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<EditableService[]>(
    Array.isArray(project.blueprint?.services) ? project.blueprint.services : []
  );
  const [servicesDirty, setServicesDirty] = useState(false);
  const [savingServices, setSavingServices] = useState(false);

  const [liveUrl, setLiveUrl] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState<string | null>(null);

  const profile = project.blueprint?.profile || {};

  // The two fields most likely to be wrong and least likely to be noticed. Both
  // shipped live on a real client site: a 555-01xx number and a .example
  // address, each invented by the generator and each looking perfectly finished.
  const unreachablePhone = /555\s?-?\s?01\d\d/.test(String(profile.phone || ''));
  const unreachableEmail = /@(.+\.)?(example|test|invalid|localhost)$|@example\.(com|net|org)$/i
    .test(String(profile.email || '').trim());

  const publish = async () => {
    if (!project.blueprint) {
      setError('This project has no blueprint yet, so there is nothing to publish.');
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await apiJson<{ siteUrl?: string }>('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.companyName || profile.name,
          currentSnapshot: project.blueprint,
          projectId: project.id,
        }),
      });
      setPublished(res.siteUrl || 'Published.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  /**
   * Pulls the blueprint back off the live page and saves it as this project's
   * blueprint, so a Cloudflare rollback can be reflected on this side too.
   *
   * It does NOT publish. The whole incident this exists for was an automatic
   * publish of a blueprint nobody had looked at; the fix must not be another one.
   * The operator opens the Studio, checks it, and deploys.
   */
  const restore = async () => {
    setRestoring(true);
    setError(null);
    try {
      const target = (liveUrl || project.domain || '').trim();
      const res = await apiJson<{ blueprint: any }>('/api/restore-from-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      await onRestore?.(res.blueprint);
      setRestored(res.blueprint?.profile?.name || 'the live blueprint');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRestoring(false);
    }
  };

  const saveServices = async () => {
    setSavingServices(true);
    setError(null);
    try {
      await onRestore?.({ ...(project.blueprint || {}), services });
      setServicesDirty(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingServices(false);
    }
  };

  const card = 'rounded-2xl border border-stone-800 bg-stone-900/60 p-5 space-y-4';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-950 border border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl my-auto py-0">
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-stone-800">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-stone-100 truncate">
              {project.companyName || 'Client'}
            </h2>
            <p className="text-xs text-stone-500">Their access, their people, and publishing.</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-stone-500 hover:text-stone-200" aria-label="Close">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 sm:p-6 space-y-5">
          {(unreachablePhone || unreachableEmail) && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Customers cannot reach this client.</p>
                <ul className="mt-1 text-xs space-y-0.5 text-amber-200/80">
                  {unreachablePhone && <li>Phone {profile.phone} is a 555-01xx number, reserved for fiction.</li>}
                  {unreachableEmail && <li>Email {profile.email} is on a reserved domain — mail bounces.</li>}
                </ul>
                <p className="mt-1.5 text-xs text-amber-200/70">
                  Fix these in the Studio, then publish below.
                </p>
              </div>
            </div>
          )}

          <section className={card}>
            <div>
              <h3 className="font-bold text-stone-100">Publish changes</h3>
              <p className="text-xs text-stone-500 mt-1">
                Edits to a project are saved to the database, but the live site is built at publish
                time — it does not read the database. Nothing you change reaches customers until
                this runs. Their photo uploads publish themselves; your edits do not.
              </p>
            </div>

            {published ? (
              <div className="flex items-start gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>Published. {project.domain && 'It may take a minute to appear.'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={publish}
                disabled={publishing || !project.blueprint}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-stone-950 disabled:opacity-40"
              >
                {publishing
                  ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  : <UploadCloud className="w-4 h-4" aria-hidden="true" />}
                {publishing ? 'Publishing…' : 'Publish to their live site'}
              </button>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </section>

          <section className={card}>
            <div>
              <h3 className="font-bold text-stone-100">Services &amp; booking links</h3>
              <p className="text-xs text-stone-500 mt-1">
                What customers see and act on. Give a service its own booking link and the visitor
                lands on that service instead of a menu asking them to pick it again.
              </p>
            </div>

            <ServicesEditor
              services={services}
              fallbackBookingUrl={profile.bookingUrl}
              onChange={next => { setServices(next); setServicesDirty(true); }}
            />

            {servicesDirty && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveServices}
                  disabled={savingServices}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-stone-800 border border-stone-700 text-stone-100 disabled:opacity-40"
                >
                  {savingServices && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Save services
                </button>
                <span className="text-xs text-stone-500">Saved changes go live when you publish.</span>
              </div>
            )}
          </section>

          <section className={card}>
            <div>
              <h3 className="font-bold text-stone-100">Restore from the live site</h3>
              <p className="text-xs text-stone-500 mt-1">
                Every published page carries the blueprint it was built from, so after a Cloudflare
                rollback the live site is the most reliable record of what this client actually has —
                more reliable than what is stored here. Pull it back and publish it to bring the two
                into agreement.
              </p>
            </div>

            {restored ? (
              <div className="flex items-start gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  Read {restored}. Open the Studio, confirm it looks right, and deploy from there —
                  that is what writes it back and records it as published.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <input
                  type="url"
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  placeholder={project.domain || 'https://their-site.pages.dev'}
                  className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
                <button
                  type="button"
                  onClick={restore}
                  disabled={restoring || !(liveUrl || project.domain)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-stone-800 border border-stone-700 text-stone-200 disabled:opacity-40"
                >
                  {restoring
                    ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    : <History className="w-4 h-4" aria-hidden="true" />}
                  {restoring ? 'Reading…' : 'Read live site'}
                </button>
              </div>
            )}
          </section>

          <section className={card}>
            <div>
              <h3 className="font-bold text-stone-100">Photo link</h3>
              <p className="text-xs text-stone-500 mt-1">
                Works with no account, the minute you send it. Right for a client who will never
                sign in; use the people list below when more than one person needs access.
              </p>
            </div>
            <PortalLinkButton projectId={project.id} token={project.portalToken} />
          </section>

          <section className={card}>
            <div>
              <h3 className="font-bold text-stone-100">People with dashboard access</h3>
              <p className="text-xs text-stone-500 mt-1">
                They sign in with Google at <span className="font-mono text-stone-400">/dashboard</span> and
                manage their own photos. Revoking one person leaves everyone else working.
              </p>
            </div>
            <AccessPanel projectId={project.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
