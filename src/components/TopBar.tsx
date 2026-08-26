import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { ViewState } from '../types';

interface TopBarProps {
  currentView: ViewState;
  onLogout?: () => void;
  onOpenMobileNav?: () => void;
}

export default function TopBar({ currentView, onLogout, onOpenMobileNav }: TopBarProps) {
  const titles: Record<ViewState, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    clients: 'Client Intake',
    prospects: 'Lead Finder',
    'agent-builder': '1-Click Studio',
    billing: 'Billing',
    settings: 'Settings'
  };

  const subtitles: Record<ViewState, string> = {
    dashboard: 'Studio overview & stats',
    projects: 'Active deployments',
    clients: 'Intake vault',
    prospects: 'Lead discovery',
    'agent-builder': 'AI website studio',
    billing: 'Invoices & revenue',
    settings: 'Configuration'
  };

  return (
    <header className="h-14 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="Open App Navigation"
          >
            <Menu className="w-4 h-4 text-[#C5A059]" />
          </button>
        )}
        <div>
          <h1 className="text-sm font-black text-stone-100 tracking-wide leading-none">
            {titles[currentView] || 'Overview'}
          </h1>
          <p className="text-[10px] font-mono text-stone-500 mt-0.5 leading-none hidden sm:block">
            {subtitles[currentView] || ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-8 pr-4 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 placeholder:text-stone-600 focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/20 outline-none w-44 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-stone-500 hover:text-stone-300 transition-colors rounded-xl hover:bg-stone-900">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C5A059] rounded-full" />
        </button>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-1.5 text-stone-500 hover:text-red-400 transition-colors border-l border-stone-800 pl-3 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
