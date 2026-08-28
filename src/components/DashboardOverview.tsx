import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Clock, CheckCircle2, Zap, Folders, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Project, ViewState } from '../types';
import { countLeads } from '../store';

interface DashboardOverviewProps {
  projects: Project[];
  onNavigate?: (view: ViewState) => void;
}

export default function DashboardOverview({ projects, onNavigate }: DashboardOverviewProps) {
  const activeProjects = projects.filter(p => p.status !== 'Live').length;
  const liveSites = projects.filter(p => p.status === 'Live').length;
  const totalProjects = projects.length;

  const [leadCount, setLeadCount] = useState<number>(0);

  useEffect(() => {
    countLeads().then(setLeadCount);
  }, []);

  // Calculate actual average turnaround time
  const liveProjectsArray = projects.filter(p => p.status === 'Live' && p.createdAt && p.updatedAt);
  let avgDays = "N/A";
  if (liveProjectsArray.length > 0) {
    const totalDays = liveProjectsArray.reduce((sum, p) => {
      const created = new Date(p.createdAt || new Date()).getTime();
      const updated = new Date(p.updatedAt || new Date()).getTime();
      const days = (updated - created) / (1000 * 60 * 60 * 24);
      return sum + Math.max(0, days);
    }, 0);
    const avg = totalDays / liveProjectsArray.length;
    avgDays = avg < 1 ? "< 1d" : `${avg.toFixed(1)}d`;
  }

  const handleQuickLaunch = (promptPrefill: string) => {
    // If we wanted to pass a prompt prefill, we could store it in localStorage or state.
    // For now, we'll just navigate to the studio.
    localStorage.setItem('txsons_studio_prompt_prefill', promptPrefill);
    if (onNavigate) onNavigate('agent-builder');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono mb-1">TEXAS SONS STUDIO</p>
          <h1 className="text-2xl font-bold text-stone-100">Overview</h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-stone-400">SYSTEMS NOMINAL</span>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Active Builds"
          value={activeProjects.toString()}
          icon={Zap}
          trend="In Progress"
          color="gold"
        />
        <MetricCard
          title="Live Sites"
          value={liveSites.toString()}
          icon={CheckCircle2}
          trend={`of ${totalProjects} total`}
          color="emerald"
        />
        <MetricCard
          title="Avg. Turnaround"
          value={avgDays}
          icon={Clock}
          trend="Time to Live"
          color="blue"
        />
        <MetricCard
          title="Intake Forms"
          value={leadCount.toString()}
          icon={Users}
          trend="Awaiting Review"
          color="purple"
        />
      </div>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Deployments */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-800/60 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest font-mono">RECENT</p>
              <h2 className="text-sm font-bold text-stone-100">Deployments</h2>
            </div>
            <Folders className="w-4 h-4 text-stone-600" />
          </div>
          <div className="divide-y divide-stone-800/60">
            {projects.length === 0 && (
              <div className="px-5 py-8 text-center">
                <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mx-auto mb-3">
                  <Folders className="w-5 h-5 text-[#C5A059]" />
                </div>
                <p className="text-sm text-stone-400">No deployments yet</p>
                <p className="text-xs text-stone-600 mt-1">Launch your first site from the 1-Click Studio</p>
              </div>
            )}
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="px-5 py-3 flex items-center justify-between hover:bg-stone-800/40 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    project.status === 'Live' ? 'bg-emerald-400' : 'bg-[#C5A059] animate-pulse'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-100 truncate">{project.companyName}</p>
                    <p className="text-[10px] font-mono text-stone-500 truncate">{project.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={project.status} />
                  <ExternalLink className="w-3.5 h-3.5 text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-800/60">
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest font-mono">QUICK LAUNCH</p>
            <h2 className="text-sm font-bold text-stone-100">Scaffolding</h2>
          </div>
          <div className="px-4 py-4 space-y-2">
            <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
              Provision environments, repos, and Cloudflare deployments instantly.
            </p>
            {[
              { label: 'Basic Website', accent: true, prompt: 'Build a standard professional website.' },
              { label: 'Lead Generation Site', accent: false, prompt: 'Build a high-conversion lead generation landing page.' },
              { label: 'Full Custom Application', accent: false, prompt: 'Initialize a custom full-stack web application.' },
            ].map(({ label, accent, prompt }) => (
              <button
                key={label}
                onClick={() => handleQuickLaunch(prompt)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
                  accent
                    ? 'bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 shadow-lg shadow-[#C5A059]/10'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Stats footer */}
          <div className="px-4 pb-4 pt-2 border-t border-stone-800/60 mt-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-stone-500">THIS MONTH</span>
              <span className="text-[#C5A059] font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{projects.filter(p => p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} deployed
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Intake: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Scaffolding: 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30',
    'Theme Assembly': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'QA & Staging': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border ${map[status] || 'bg-stone-800 text-stone-400 border-stone-700'}`}>
      {status.toUpperCase()}
    </span>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; trend?: string; color: string }) {
  const iconClass: Record<string, string> = {
    gold: 'bg-[#C5A059]/10 border-[#C5A059]/20 text-[#C5A059]',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  const valueClass: Record<string, string> = {
    gold: 'text-[#C5A059]',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest font-mono">{title}</p>
          <div className={`w-7 h-7 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border flex items-center justify-center flex-shrink-0 ${iconClass[color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className={`text-3xl font-bold ${valueClass[color]}`}>{value}</p>
      </div>
      {trend && (
        <p className="text-[10px] font-mono text-stone-600 mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </p>
      )}
    </div>
  );
}
