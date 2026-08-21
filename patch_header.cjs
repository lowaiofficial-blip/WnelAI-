const fs = require('fs');

const headerContent = `import React from 'react';
import { PanelLeftOpen, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Model } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { WnelLogo } from '../common/WnelLogo';

interface HeaderProps {
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  onOpenProfile: (tab?: 'profile' | 'account' | 'notifications' | 'appearance') => void;
  onOpenAdmin: () => void;
}

export function Header({ 
  selectedModel, 
  onToggleSidebar, 
  isSidebarOpen, 
  onOpenAdmin 
}: HeaderProps) {
  const { user, profile, isAdmin } = useAuth();
  
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
          "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border shadow-lg backdrop-blur-md",
          isThinking 
            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-indigo-500/10" 
            : "bg-sky-500/10 text-sky-300 border-sky-500/20 shadow-sky-500/10"
        )}>
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isThinking ? "bg-indigo-400" : "bg-sky-400")}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isThinking ? "bg-indigo-500" : "bg-sky-500")}></span>
          </span>
          {selectedModel.name}
        </div>
      </div>

      {/* Right side: Minimal Actions */}
      <div className="flex items-center gap-2">
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
`;

fs.writeFileSync('src/components/layout/Header.tsx', headerContent);
console.log('Header patched successfully');
