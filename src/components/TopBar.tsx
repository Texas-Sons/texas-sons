import React from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface TopBarProps {
  currentView: ViewState;
  onLogout?: () => void;
}

export default function TopBar({ currentView, onLogout }: TopBarProps) {
  const titles: Record<ViewState, string> = {
    dashboard: 'Dashboard Overview',
    projects: 'Project Management',
    clients: 'Client Intake Vault',
    prospects: 'Lead Finder',
    templates: 'Core Template Library',
    'agent-builder': 'AI Builder Studio',
    billing: 'Billing & Invoicing',
    settings: 'Studio Settings'
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-display font-semibold text-stone-900">{titles[currentView]}</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="pl-9 pr-4 py-1.5 bg-stone-100 border-transparent rounded-full text-sm focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-stone-400 hover:text-stone-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
        </button>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-2 text-stone-400 hover:text-red-500 transition-colors border-l border-stone-200 pl-6"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
