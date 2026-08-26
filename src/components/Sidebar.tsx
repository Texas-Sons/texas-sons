import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Folders, 
  Users, 
  Settings,
  Receipt,
  Target,
  Zap,
  Lock,
  Unlock,
  X,
  LucideIcon
} from 'lucide-react';
import { ViewState } from '../types';
import TexasSonsLogo from './TexasSonsLogo';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemConfig {
  id: ViewState;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export default function Sidebar({ 
  currentView, 
  onNavigate,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isExpanded = isHovered || isPinned;

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agent-builder', label: '1-Click Studio', icon: Zap, highlight: true },
    { id: 'projects', label: 'Projects', icon: Folders },
    { id: 'prospects', label: 'Lead Finder', icon: Target },
    { id: 'clients', label: 'Client Intake', icon: Users },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* ── Mobile Navigation Drawer Modal (When Hamburger Tapped) ─────── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden bg-black/80 backdrop-blur-md flex animate-in fade-in duration-200">
          <div className="w-72 bg-stone-950 border-r border-stone-800 h-full flex flex-col p-4 space-y-4 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <TexasSonsLogo className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white font-texas tracking-wide">TX Sons</h3>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Websites Studio</p>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-[16px_8px_14px_8px/8px_14px_8px_16px] transition-all cursor-pointer text-left active:scale-[0.98] ${
                      isActive
                        ? 'bg-stone-900 border border-orange-500/40 text-white shadow-md'
                        : 'text-stone-400 hover:bg-stone-900/60 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-[12px_5px_14px_6px/6px_14px_5px_12px] border flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold flex-1">{item.label}</span>
                    {item.highlight && (
                      <span className="px-1.5 py-0.5 rounded-[8px_3px_10px_4px/4px_10px_3px_8px] text-[9px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/30">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Profile */}
            <div className="pt-3 border-t border-stone-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[12px_5px_14px_6px/6px_14px_5px_12px] bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                TS
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Texas Sons Studio</p>
                <p className="text-[10px] text-stone-500 truncate">Mobile Control Panel</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}

      {/* Static Spacer so content doesn't jump on desktop */}
      <div className="hidden md:block w-14 flex-shrink-0" />

      {/* Supabase-style Floating / Expanding Sidebar (Desktop Only) */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-[60] bg-stone-950 text-stone-300 flex-col border-r border-stone-800 transition-all duration-200 ease-in-out select-none ${
          isExpanded 
            ? 'w-60 shadow-2xl shadow-black/80 bg-stone-950/98 backdrop-blur-xl' 
            : 'w-14'
        }`}
      >
        {/* Top Header & Logo */}
        <div className={`h-16 flex items-center border-b border-stone-800/80 justify-between flex-shrink-0 transition-all ${
          isExpanded ? 'px-3.5' : 'px-2 justify-center'
        }`}>
          <div className={`flex items-center min-w-0 overflow-hidden ${!isExpanded ? 'justify-center w-full' : ''}`}>
            <TexasSonsLogo className={`${isExpanded ? 'w-9 h-9' : 'w-10 h-10'} flex-shrink-0 transition-all`} />
            {isExpanded && (
              <div className="flex flex-col min-w-0 ml-2.5 animate-in fade-in duration-200">
                <div className="flex items-baseline">
                  <span className="text-white font-texas font-normal text-lg tracking-wide truncate">TX Sons</span>
                  <span className="text-orange-500 font-sans text-[9px] ml-1.5 font-bold uppercase tracking-widest flex-shrink-0">- WEBSITES</span>
                </div>
              </div>
            )}
          </div>

          {/* Pin/Lock Sidebar Toggle (only visible when expanded) */}
          {isExpanded && (
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="p-1 rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-800/60 transition-colors flex-shrink-0"
              title={isPinned ? "Unpin Sidebar (Hover Mode)" : "Pin Sidebar (Keep Open)"}
            >
              {isPinned ? <Lock className="w-3.5 h-3.5 text-orange-400" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        
        {/* Navigation Menu */}
        <div className="py-3 px-2 flex-1 overflow-y-auto overflow-x-hidden space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all relative group ${
                  isExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'
                } ${
                  isActive 
                    ? 'bg-stone-800/90 text-white font-semibold shadow-inner ring-1 ring-stone-700/50' 
                    : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-100'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-orange-500 rounded-r-full" />
                )}

                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive 
                    ? 'text-orange-500' 
                    : item.highlight 
                      ? 'text-orange-400/90 group-hover:text-orange-400' 
                      : 'text-stone-400 group-hover:text-stone-200'
                } ${isExpanded ? 'mr-3' : ''}`} />

                {isExpanded && (
                  <span className="text-xs truncate font-medium tracking-normal animate-in fade-in duration-150 flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {isExpanded && item.highlight && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Profile / Account */}
        <div className="p-2 border-t border-stone-800/80 bg-stone-950/90 flex-shrink-0">
          <div className={`flex items-center rounded-xl p-1.5 transition-colors hover:bg-stone-900 ${
            !isExpanded ? 'justify-center' : 'space-x-3'
          }`}>
            <div className="w-7 h-7 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0 shadow-sm">
              TS
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1 animate-in fade-in duration-150">
                <p className="text-xs font-semibold text-white truncate">TX Sons Studio</p>
                <p className="text-[10px] text-stone-500 truncate">Admin Console</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
