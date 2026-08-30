import React, { useState } from 'react';
import { Plus, ExternalLink, Wand2, Trash2, FileText, FileCheck, Search, Folders, Globe } from 'lucide-react';
import { Project, Status, Tier } from '../types';
import { ProjectProposalModal } from './ProjectProposalModal';
import { PortalLinkButton } from './PortalLinkButton';

interface ProjectListProps {
  projects: Project[];
  onNewProject: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onSaveProject?: (project: Project) => void;
}

type FilterState = 'all' | 'live' | 'active' | 'draft';

export default function ProjectList({ projects, onNewProject, onEditProject, onDeleteProject, onSaveProject }: ProjectListProps) {
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [filter, setFilter] = useState<FilterState>('all');
  const [search, setSearch] = useState('');

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Intake': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Scaffolding': return 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30';
      case 'Theme Assembly': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'QA & Staging': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Live': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  const getTierColor = (tier: Tier) => {
    if (tier.includes('Basic') || tier.includes('Spur') || tier.includes('Sprout')) return 'text-[#C5A059]';
    if (tier.includes('Lead') || tier.includes('Ranger') || tier.includes('Stem')) return 'text-teal-400';
    return 'text-blue-400';
  };

  const filtered = projects.filter(p => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'live' && p.status === 'Live') ||
      (filter === 'active' && p.status !== 'Live' && p.status !== 'Intake') ||
      (filter === 'draft' && p.status === 'Intake');
    const matchesSearch =
      !search ||
      p.companyName.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono mb-1">ACTIVE</p>
          <h1 className="text-2xl font-bold text-stone-100">Deployments</h1>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#C5A059]/10"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Site</span>
        </button>
      </div>

      {/* ── Search + Filter Bar ──────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 placeholder:text-stone-600 focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'live', 'active', 'draft'] as FilterState[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize ${
                filter === f
                  ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30'
                  : 'bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project Cards ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-4">
            <Folders className="w-6 h-6 text-[#C5A059]" />
          </div>
          <p className="text-sm font-bold text-stone-300">No projects found</p>
          <p className="text-xs text-stone-600 mt-1">Provision your first site to get started.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-4 hover:border-stone-700 transition-all group cursor-pointer"
              onClick={() => setSelectedProjectForModal(project)}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Company Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center flex-shrink-0 text-xs font-black text-[#C5A059]">
                    {project.companyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-stone-100 group-hover:text-[#C5A059] transition-colors truncate">
                        {project.companyName}
                      </span>
                      {project.contracts && project.contracts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                          <FileCheck className="w-2.5 h-2.5" />SIGNED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-stone-500 mt-0.5">{project.clientName}</p>
                    {project.domain && (
                      <p className="text-[10px] font-mono text-stone-600 mt-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {project.domain.replace(/^https?:\/\//, '')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status + Tier + Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-bold ${getTierColor(project.tier)}`}>
                    {project.tier}
                  </span>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-800/60" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setSelectedProjectForModal(project)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 rounded-lg transition-all cursor-pointer active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />Proposal
                </button>
                {onEditProject && (
                  <button
                    onClick={() => onEditProject(project)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-all cursor-pointer active:scale-95"
                  >
                    <Wand2 className="w-3.5 h-3.5" />Studio
                  </button>
                )}
                <PortalLinkButton
                  projectId={project.id}
                  token={(project as any).portalToken}
                />
                {project.domain && (
                  <a
                    href={project.domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-stone-500 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
                    title="View Live Site"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {onDeleteProject && (
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-1.5 text-stone-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[9px] font-mono text-stone-600 ml-auto">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Proposal & Details Modal */}
      {selectedProjectForModal && (
        <ProjectProposalModal
          isOpen={Boolean(selectedProjectForModal)}
          onClose={() => setSelectedProjectForModal(null)}
          project={selectedProjectForModal}
          snapshot={selectedProjectForModal.blueprint}
          onSaveProject={(updated) => {
            if (onSaveProject) onSaveProject(updated);
            setSelectedProjectForModal(null);
          }}
          onLaunchStudio={(p) => {
            if (onEditProject) onEditProject(p);
            setSelectedProjectForModal(null);
          }}
        />
      )}

    </div>
  );
}
