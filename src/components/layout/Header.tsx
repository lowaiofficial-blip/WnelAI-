import React from 'react';
import { PanelLeftOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Model } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { WnelLogo } from '../common/WnelLogo';
import { GoBadge } from '../common/GoBadge';

interface HeaderProps {
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  onOpenProfile: (tab?: 'profile' | 'account' | 'notifications' | 'appearance') => void;
  onOpenAdmin: () => void;
  onOpenGoModal?: () => void;
}

export function Header({ 
  selectedModel, 
  onToggleSidebar, 
  isSidebarOpen, 
  onOpenAdmin,
  onOpenGoModal 
}: HeaderProps) {
  const { user, isAdmin, isGo } = useAuth();
  
  const isThinking = selectedModel.id.includes('deepseek') || selectedModel.name.includes('Düşünen');

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.05] h-[64px] flex items-center justify-between px-3 sm:px-4">
      {/* Left side: Sidebar Toggle & Brand (when sidebar closed) */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10"
            title="Menüyü Aç"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        
        {/* Brand logo (visible mostly on mobile or when sidebar is closed) */}
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          isSidebarOpen ? "hidden md:flex opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100"
        )}>
          <WnelLogo size="sm" withGlow={true} />
          <span className="hidden sm:inline-block font-bold text-white tracking-wide">WnelAI</span>
        </div>
      </div>

      {/* Center: Current Model Badge */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div className={cn(
          "px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2.5 border backdrop-blur-md transition-all duration-300",
          isThinking 
            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
            : "bg-white/[0.08] text-white border-white/20 shadow-[0_0_18px_rgba(255,255,255,0.2)]"
        )}>
          <span className="relative flex h-2 w-2 items-center justify-center">
            {isThinking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-white opacity-75" style={{ animationDuration: '1.5s' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_8px_#ffffff]"></span>
              </>
            )}
          </span>
          <span className="tracking-wide font-medium">{selectedModel.name}</span>
        </div>
      </div>

      {/* Right side: Actions, Go status & Admin */}
      <div className="flex items-center gap-2">
        {isGo ? (
          <div onClick={onOpenGoModal} className="cursor-pointer">
            <GoBadge size="sm" />
          </div>
        ) : onOpenGoModal ? (
          <button
            onClick={onOpenGoModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">WnelAI Go</span>
            <span className="sm:hidden">Go</span>
          </button>
        ) : null}

        {user && isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            title="Yönetici Paneli"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
}
