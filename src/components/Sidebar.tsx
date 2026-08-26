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
                  <h3 className="text-sm font-bold text-stone-100 font-mono tracking-wide">TEXAS SONS</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Websites Studio</p>
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
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer text-left active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#C5A059]/10 border border-[#C5A059]/30 text-stone-100 shadow-md shadow-[#C5A059]/5'
                        : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-[#C5A059]/20 border-[#C5A059]/40 text-[#C5A059]'
                        : 'bg-stone-900 border-stone-800 text-stone-500'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer Profile */}
            <div className="pt-3 border-t border-stone-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-xs font-bold text-[#C5A059] flex-shrink-0">
                MO
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-100 truncate">Morgan</p>
                <p className="text-[10px] text-stone-500 truncate font-mono">Admin Console</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}

      {/* Static Spacer so content doesn't jump on desktop */}
      <div className="hidden md:block w-16 flex-shrink-0" />

      {/* ── Desktop Navigation Sidebar ──────────────────────────────────── */}
      <div 
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 bg-stone-950 border-r border-stone-800/80 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-40
          ${isExpanded ? 'w-64' : 'w-16'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header / Logo */}
        <div className={`h-16 flex items-center border-b border-stone-800/80 shrink-0
          ${isExpanded ? 'px-4 justify-between' : 'justify-center'}
        `}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <TexasSonsLogo className={`w-7 h-7 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'scale-100' : 'scale-90'}`} />
            
            <div className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'}`}>
              <h3 className="text-sm font-bold text-stone-100 tracking-wide font-mono">TEXAS SONS</h3>
              <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Websites Studio</p>
            </div>
          </div>
          
          {isExpanded && (
            <button 
              onClick={() => setIsPinned(!isPinned)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 transition-colors"
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isPinned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden px-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`
                  relative w-full flex items-center transition-all duration-200 cursor-pointer
                  ${isExpanded ? 'px-3 py-2.5 rounded-xl gap-3' : 'p-2 rounded-xl justify-center mx-auto aspect-square max-w-[40px]'}
                  ${isActive 
                    ? 'bg-[#C5A059]/10 text-stone-100 border border-[#C5A059]/20 shadow-[#C5A059]/5' 
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200 border border-transparent'}
                `}
              >
                <div className={`
                  flex items-center justify-center
                  ${!isExpanded ? '' : isActive ? 'text-[#C5A059]' : 'text-stone-500'}
                  ${!isExpanded && isActive ? 'text-[#C5A059]' : ''}
                `}>
                  <item.icon className={`w-4 h-4 ${item.highlight && !isActive ? 'text-[#C5A059]' : ''}`} />
                </div>
                
                {isExpanded && (
                  <span className={`text-xs font-bold whitespace-nowrap ${isActive ? 'text-stone-100' : 'text-stone-400'}`}>
                    {item.label}
                  </span>
                )}

                {/* Badge indicator for active or highlighted items when collapsed */}
                {!isExpanded && (isActive || item.highlight) && (
                  <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#C5A059]' : 'bg-[#C5A059] animate-pulse'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Profile */}
        <div className={`border-t border-stone-800/80 p-3 shrink-0
          ${isExpanded ? 'flex items-center gap-3' : 'flex justify-center'}
        `}>
          <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#C5A059]">
            MO
          </div>
          
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-200 truncate">Morgan</p>
              <p className="text-[10px] text-stone-500 font-mono truncate">Admin Console</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
