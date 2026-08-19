import React from 'react';
import { Plus, MoreHorizontal, ExternalLink, Wand2, Trash2 } from 'lucide-react';
import { Project, Status, Tier } from '../types';

interface ProjectListProps {
  projects: Project[];
  onNewProject: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

export default function ProjectList({ projects, onNewProject, onEditProject, onDeleteProject }: ProjectListProps) {
  
  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Intake': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Scaffolding': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Theme Assembly': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'QA & Staging': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Live': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getTierColor = (tier: Tier) => {
    if (tier.includes('Basic') || tier.includes('Spur') || tier.includes('Sprout')) return 'text-orange-600';
    if (tier.includes('Lead') || tier.includes('Ranger') || tier.includes('Stem')) return 'text-teal-600';
    return 'text-indigo-600';
  };

  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-display font-semibold text-stone-900">Active Deployments</h2>
          <p className="text-sm text-stone-500 mt-1">Manage client sites and provisioning statuses.</p>
        </div>
        <button 
          onClick={onNewProject}
          className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Provision New Site
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Product Tier</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-stone-900">{project.companyName}</span>
                      <span className="text-xs text-stone-500 mt-0.5">{project.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getTierColor(project.tier)}`}>
                      {project.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {onEditProject && (
                        <button
                          onClick={() => onEditProject(project)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-600/10 hover:bg-orange-600 text-orange-600 hover:text-white rounded-lg transition-all border border-orange-500/20 hover:border-orange-600 shadow-sm"
                          title="Open and update site in AI Builder Studio"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Edit in Studio</span>
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {project.domain && (
                        <a 
                          href={project.domain} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors" 
                          title="View Live Site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-stone-500">No active projects found. Provision your first site to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
