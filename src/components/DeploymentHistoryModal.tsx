import React, { useState, useEffect } from 'react';
import {
  UploadCloud, X, Check, Copy, ExternalLink, ShieldCheck,
  RefreshCw, History, Globe, Zap, ArrowUpRight, Clock, AlertTriangle
} from 'lucide-react';

interface DeploymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  activeUrl?: string;
  onOpenCustomDomains: () => void;
  onRedeploy: () => void;
  isDeploying?: boolean;
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

export default function DeploymentHistoryModal({
  isOpen,
  onClose,
  projectName,
  activeUrl,
  onOpenCustomDomains,
  onRedeploy,
  isDeploying
}: DeploymentHistoryModalProps) {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
  const liveUrl = activeUrl || `https://${slug}.pages.dev`;

  const fetchHistory = async () => {
    if (!projectName) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/deployments/history?project=${encodeURIComponent(projectName)}`);
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

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, projectName]);

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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
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
              className="text-xs font-mono font-bold text-orange-400 hover:text-orange-300 truncate flex items-center gap-1.5"
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
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-orange-600/30"
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
              className="text-xs font-semibold text-stone-300 hover:text-orange-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>Connect Custom Domain (Namecheap / GoDaddy)</span>
            </button>

            <button
              type="button"
              onClick={onRedeploy}
              disabled={isDeploying}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="text-[10px] font-bold text-stone-400 hover:text-orange-400 flex items-center gap-1 transition-colors"
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
                        ? 'bg-stone-950 border-orange-500/40 ring-1 ring-orange-500/20'
                        : 'bg-stone-950/80 border-stone-800'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono truncate">
                          {dep.id ? dep.id.slice(0, 10) : `Deploy #${idx + 1}`}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
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
