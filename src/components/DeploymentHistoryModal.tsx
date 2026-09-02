import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  UploadCloud, X, Check, Copy, ExternalLink, ShieldCheck,
  RefreshCw, History, Globe, Zap, ArrowUpRight, Clock, AlertTriangle, Undo2, Loader2
} from 'lucide-react';

interface DeploymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  activeUrl?: string;
  onOpenCustomDomains: () => void;
  onRedeploy: () => void;
  isDeploying?: boolean;
  /** Row id of the project, for its version history. Absent on unsaved sites. */
  projectId?: string;
  /**
   * Loads an older version back into the editor.
   *
   * Deliberately not a publish. Restoring puts the old blueprint on the canvas
   * where it can be looked at and deployed on purpose — a restore that went
   * straight to the live site would be a second irreversible action offered as
   * the remedy for the first.
   */
  onRestoreVersion?: (blueprint: any, label: string) => void;
}

interface VersionItem {
  id: string;
  label: string | null;
  created_at: string;
}

interface DeploymentItem {
  id: string;
  url: string;
  environment: string;
  created_on: string;
  latest_stage?: { status?: string; name?: string };
  aliases?: string[];
  is_current?: boolean;
}

/** "3h ago" reads faster than a timestamp when judging how stale something is. */
function describeWhen(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return 'unknown';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function DeploymentHistoryModal({
  isOpen,
  onClose,
  projectName,
  activeUrl,
  onOpenCustomDomains,
  onRedeploy,
  isDeploying,
  projectId,
  onRestoreVersion
}: DeploymentHistoryModalProps) {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
  const liveUrl = activeUrl || `https://${slug}.pages.dev`;

  const fetchHistory = async () => {
    if (!projectName) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/deployments/history?project=${encodeURIComponent(projectName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.deployments)) {
        setDeployments(data.deployments);
      }
    } catch (err: any) {
      console.error('Fetch deployments error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * The site's own version history, which is a different thing from the
   * Cloudflare list above it: that one records builds, this one records what
   * was on the page. A build can succeed while publishing the wrong content,
   * which is exactly what happened four times last month.
   */
  const fetchVersions = async () => {
    if (!projectId) return;
    try {
      const res = await apiFetch(`/api/projects/${encodeURIComponent(projectId)}/versions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.versions)) setVersions(data.versions);
    } catch (err: any) {
      console.error('Fetch versions error:', err);
    }
  };

  const restore = async (v: VersionItem) => {
    if (!projectId || !onRestoreVersion) return;
    setRestoringId(v.id);
    setVersionError(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(v.id)}`
      );
      const data = await res.json();
      if (!data.success || !data.version?.blueprint) {
        throw new Error(data.error || 'That version could not be read.');
      }
      onRestoreVersion(data.version.blueprint, v.label || describeWhen(v.created_at));
      onClose();
    } catch (err: any) {
      // Surfaced rather than swallowed: this is the recovery path, and a silent
      // failure here leaves the operator believing a bad site was restored.
      setVersionError(err?.message || 'That version could not be restored.');
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      fetchVersions();
    }
  }, [isOpen, projectName, projectId]);

  if (!isOpen) return null;

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Deployment & Edge Hub</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Global CDN
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Real-time edge status, deployment history, and DNS controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Live Status Card */}
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">Live Production URL</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              SSL / HTTPS Secured
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-900/90 rounded-xl border border-stone-800 gap-3">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold text-[#C5A059] hover:text-[#C5A059] truncate flex items-center gap-1.5"
            >
              <span>{liveUrl}</span>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
            </a>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={copyLiveUrl}
                className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#C5A059]/90 hover:bg-[#C5A059] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-[#C5A059]/30"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Visit</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomDomains();
              }}
              className="text-xs font-semibold text-stone-300 hover:text-[#C5A059] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Connect Custom Domain (Namecheap / GoDaddy)</span>
            </button>

            <button
              type="button"
              onClick={onRedeploy}
              disabled={isDeploying}
              className="text-xs font-bold text-[#C5A059] hover:text-[#C5A059] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isDeploying ? 'Deploying...' : 'Redeploy Blueprint'}</span>
            </button>
          </div>
        </div>

        {/* Deployment History Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-stone-400" />
              <span>Recent Deployments ({deployments.length})</span>
            </label>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoading}
              className="text-[10px] font-bold text-stone-400 hover:text-[#C5A059] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {deployments.length === 0 ? (
            <div className="p-6 bg-stone-950/60 rounded-2xl border border-stone-800 text-center space-y-1">
              <UploadCloud className="w-6 h-6 text-stone-600 mx-auto" />
              <p className="text-xs font-semibold text-stone-400">No deployment logs retrieved.</p>
              <p className="text-[10px] text-stone-500">Deploy your site to see live Cloudflare Pages build logs and timestamps.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {deployments.map((dep, idx) => {
                const isCurrent = idx === 0;
                const formattedDate = dep.created_on
                  ? new Date(dep.created_on).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Just now';

                return (
                  <div
                    key={dep.id || idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-stone-950 border-[#C5A059]/40 ring-1 ring-[#C5A059]/20'
                        : 'bg-stone-950/80 border-stone-800'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono truncate">
                          {dep.id ? dep.id.slice(0, 10) : `Deploy #${idx + 1}`}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                            Active Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        <span>·</span>
                        <span>Production Branch</span>
                      </div>
                    </div>

                    <a
                      href={dep.url || liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="View deployment snapshot"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Preview</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Published versions — what was on the page, not what built */}
        {projectId && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Undo2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Published Versions ({versions.length})</span>
              </label>
              <button
                type="button"
                onClick={fetchVersions}
                className="text-[10px] font-bold text-stone-400 hover:text-[#C5A059] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {versionError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300">{versionError}</p>
              </div>
            )}

            {versions.length === 0 ? (
              <div className="p-6 bg-stone-950/60 rounded-2xl border border-stone-800 text-center space-y-1">
                <Undo2 className="w-6 h-6 text-stone-600 mx-auto" />
                <p className="text-xs font-semibold text-stone-400">No versions recorded yet.</p>
                <p className="text-[10px] text-stone-500">
                  Every deploy from here on is kept, so a bad save can be undone.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {versions.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      idx === 0
                        ? 'bg-stone-950 border-emerald-500/30 ring-1 ring-emerald-500/10'
                        : 'bg-stone-950/80 border-stone-800'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {v.label || 'Published'}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            On the site
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500">
                        <Clock className="w-3 h-3" />
                        <span>{describeWhen(v.created_at)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => restore(v)}
                      disabled={restoringId !== null || idx === 0}
                      title={
                        idx === 0
                          ? 'This is what is on the site now.'
                          : 'Load this version into the editor. It is not published until you deploy.'
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      {restoringId === v.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Undo2 className="w-3 h-3" />}
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-stone-600 leading-snug">
              Restoring loads that version onto the canvas. Nothing reaches the live site until you deploy.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloudflare Direct Upload (Blake3 Verified)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
