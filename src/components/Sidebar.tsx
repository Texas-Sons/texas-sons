import React from 'react';
import { 
  LayoutDashboard, 
  Folders, 
  Users, 
  Component, 
  Settings,
  Receipt,
  Target,
  Bot
} from 'lucide-react';
import { ViewState } from '../types';
import TexasSonsLogo from './TexasSonsLogo';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Folders },
    { id: 'clients', label: 'Client Intake', icon: Users },
    { id: 'prospects', label: 'Lead Finder', icon: Target },
    { id: 'templates', label: 'Core Templates', icon: Component },
  { id: 'agent-builder', label: 'AI Builder Studio', icon: Bot },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="w-64 bg-stone-950 text-stone-300 flex flex-col h-full border-r border-stone-800">
      <div className="h-16 flex items-center px-5 border-b border-stone-800">
        <TexasSonsLogo className="w-10 h-10 mr-3" />
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className="text-white font-texas font-normal text-xl tracking-wide">Texas Sons</span>
            <span className="text-orange-500 font-sans text-[10px] ml-1.5 font-bold uppercase tracking-widest">- WEBSITES</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                currentView === item.id 
                  ? 'bg-stone-800 text-white' 
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${currentView === item.id ? 'text-orange-500' : 'text-stone-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-stone-800">
        <div className="flex items-center px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-medium text-white">
            T
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Texas Sons Websites</p>
            <p className="text-xs text-stone-500">Admin Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
