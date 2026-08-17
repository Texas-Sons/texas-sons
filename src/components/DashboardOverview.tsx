import React from 'react';
import { ArrowUpRight, Clock, CheckCircle2, Zap } from 'lucide-react';
import { Project } from '../types';

interface DashboardOverviewProps {
  projects: Project[];
}

export default function DashboardOverview({ projects }: DashboardOverviewProps) {
  const activeProjects = projects.filter(p => p.status !== 'Live').length;
  const liveSites = projects.filter(p => p.status === 'Live').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Active Builds" 
          value={activeProjects.toString()} 
          icon={Zap} 
          trend="+2 this week"
          color="orange"
        />
        <MetricCard 
          title="Live Sites" 
          value={liveSites.toString()} 
          icon={CheckCircle2}
          color="blue"
        />
        <MetricCard 
          title="Avg. Turnaround" 
          value="4.2 Days" 
          icon={Clock} 
          trend="-15% vs last month"
          color="amber"
        />
        <MetricCard 
          title="Intake Forms" 
          value="12" 
          icon={ArrowUpRight} 
          trend="3 awaiting review"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-stone-900 mb-6">Recent Deployments</h2>
          <div className="space-y-6">
            {projects.slice(0, 4).map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${project.status === 'Live' ? 'bg-orange-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{project.companyName}</p>
                    <p className="text-xs text-stone-500">Client: {project.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                    {project.tier}
                  </span>
                  <p className="text-xs text-stone-400 mt-1">Updated today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-stone-900 rounded-xl border border-stone-800 p-6 shadow-sm text-white">
          <h2 className="text-lg font-display font-semibold mb-2">Automated Scaffolding</h2>
          <p className="text-sm text-stone-400 mb-6 leading-relaxed">
            Instantly provision new Supabase environments, GitHub repositories, and Vercel deployments.
          </p>
          <div className="space-y-3">
            <button className="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Initialize Basic Website
            </button>
            <button className="w-full bg-stone-800 hover:bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium border border-stone-700 transition-colors">
              Initialize Lead Generation Site
            </button>
            <button className="w-full bg-stone-800 hover:bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium border border-stone-700 transition-colors">
              Initialize Full Custom Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  const colorMap: Record<string, string> = {
    orange: 'text-orange-600 bg-orange-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="text-3xl font-display font-semibold text-stone-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 text-xs font-medium text-stone-500">
          {trend}
        </div>
      )}
    </div>
  );
}
