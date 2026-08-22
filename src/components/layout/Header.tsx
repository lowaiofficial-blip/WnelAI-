import React from 'react';
import { 
  Menu, 
  ChevronDown, 
  Sparkles, 
  SquarePen, 
  ShieldCheck, 
  LogIn, 
  User as UserIcon,
  Zap,
  Brain
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Model } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
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
  onOpenModelSheet?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export function Header({ 
  selectedModel, 
  onToggleSidebar, 
  onNewChat,
  onOpenProfile,
  onOpenAdmin,
  onOpenGoModal,
  onOpenModelSheet,
  onOpenAuth
}: HeaderProps) {
  const { user, profile, isAdmin, isGo } = useAuth();
  
  const isThinking = selectedModel.id.includes('deepseek') || selectedModel.name.includes('Düşünen');
  const modelDisplayName = isThinking ? 'Wnel3.8-Max' : 'Wnel3.7-Plus';

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/[0.06] h-[60px] flex items-center justify-between px-3 sm:px-5 select-none">
      {/* Left side: Hamburger button + Model Selector Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger Menu button with modern dual bars */}
        <button 
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 flex items-center justify-center text-zinc-200 hover:text-white transition-all cursor-pointer border border-white/5 shadow-sm"
          title="Menüyü Aç"
          aria-label="Menü"
        >
          <div className="flex flex-col gap-1.5 items-center justify-center">
            <span className="w-4 h-[2px] bg-current rounded-full" />
            <span className="w-4 h-[2px] bg-current rounded-full" />
          </div>
        </button>

        {/* Model dropdown button (Screenshot 2 / Qwen style) */}
        <button
          onClick={onOpenModelSheet}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-white text-[14px] font-semibold transition-all cursor-pointer group shadow-sm"
          title="Model Değiştir"
        >
          {isThinking ? (
            <Brain className="w-4 h-4 text-indigo-400 stroke-[2.2]" />
          ) : (
            <Zap className="w-4 h-4 text-blue-400 stroke-[2.2] fill-blue-400/20" />
          )}
          <span>{modelDisplayName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>

      {/* Right side: Plus/Go Plan Button, New Chat, Login/Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Go / Plus Plan Join Pill (Screenshot 1: "✨ Plus planına katıl") */}
        {isGo ? (
          <div onClick={onOpenGoModal} className="cursor-pointer">
            <GoBadge size="sm" />
          </div>
        ) : onOpenGoModal ? (
          <button
            onClick={onOpenGoModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b2738]/90 hover:bg-[#22334a] border border-sky-400/30 text-sky-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm shadow-sky-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
            <span className="hidden sm:inline">Go planına katıl</span>
            <span className="sm:hidden">Go</span>
          </button>
        ) : null}

        {/* New Chat Icon Button (Screenshot 1 circular edit/chat icon) */}
        <button
          onClick={onNewChat}
          className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 flex items-center justify-center text-zinc-200 hover:text-white transition-all cursor-pointer border border-white/5 shadow-sm"
          title="Yeni Sohbet"
          aria-label="Yeni Sohbet"
        >
          <SquarePen className="w-4.5 h-4.5 stroke-[2]" />
        </button>

        {/* Admin Link if admin */}
        {user && isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="hidden md:flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer"
            title="Yönetici Paneli"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}

        {/* Auth / Profile Button */}
        {!user ? (
          <button
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-md shadow-blue-600/30"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş yap</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenProfile('profile')}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-white/20 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
            title="Hesap Ayarları"
          >
            {profile?.displayName?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
}
