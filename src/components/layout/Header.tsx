import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronDown, 
  MessageSquarePlus, 
  X, 
  PanelLeftOpen, 
  LogOut,
  ShieldCheck,
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Model, AVAILABLE_MODELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
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
  onModelSelect, 
  onToggleSidebar, 
  isSidebarOpen, 
  onNewChat, 
  onOpenProfile, 
  onOpenAdmin 
}: HeaderProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const { user, profile, isAdmin, signOut } = useAuth();

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsModelDropdownOpen(false);
  };

  const isThinking = selectedModel.id.includes('deepseek') || selectedModel.name.includes('Düşünen');

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-3.5 sm:px-5 py-3 bg-[#070a14]/80 backdrop-blur-xl border-b border-white/[0.07] transition-all">
        {/* Left side: Sidebar Toggle & Model Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-zinc-400 hover:text-white hover:bg-white/[0.06] active:scale-95 rounded-xl transition-all lg:hidden cursor-pointer"
            title="Menüyü Aç"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          
          {/* Logo on small screens when sidebar is closed */}
          <div className="flex items-center lg:hidden">
            <WnelLogo size="sm" showText={false} />
          </div>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium text-sm sm:text-[15px]",
                isThinking
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "bg-sky-500/10 border-sky-500/30 text-sky-200 hover:bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
              )}
            >
              <div className="flex items-center gap-1.5">
                {isThinking ? (
                  <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                )}
                <span>{selectedModel.name}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 hidden sm:inline-block">
                {isThinking ? 'R1 Reasoning' : 'Ultra Fast'}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-200", isModelDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isModelDropdownOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsModelDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[380px] bg-[#0c1222]/95 backdrop-blur-2xl border border-sky-500/20 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-3.5 px-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span className="font-semibold text-sm text-white tracking-wide">WnelAI Model Seçici</span>
                      </div>
                      <button 
                        onClick={() => setIsModelDropdownOpen(false)} 
                        className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Model List */}
                    <div className="p-2 space-y-1.5">
                      {AVAILABLE_MODELS.map((model) => {
                        const isSelected = selectedModel.id === model.id;
                        const isModelThinking = model.id.includes('deepseek') || model.name.includes('Düşünen');

                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (model.disabled) return;
                              onModelSelect(model);
                              setIsModelDropdownOpen(false);
                            }}
                            disabled={model.disabled}
                            className={cn(
                              "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 relative cursor-pointer border",
                              isSelected 
                                ? (isModelThinking 
                                    ? "bg-indigo-950/40 border-indigo-500/40 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                                    : "bg-sky-950/40 border-sky-500/40 text-white shadow-[0_0_20px_rgba(14,165,233,0.2)]")
                                : "bg-white/[0.02] hover:bg-white/[0.06] border-transparent text-zinc-300 hover:border-white/10",
                              model.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                            )}
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                              isModelThinking 
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" 
                                : "bg-sky-500/20 border-sky-500/30 text-sky-400"
                            )}>
                              {isModelThinking ? <Brain className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                                  {model.name}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                  isModelThinking ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                )}>
                                  {isModelThinking ? 'DeepSeek R1' : 'Qwen Plus'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed m-0">
                                {model.description}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white mt-1 shadow-md shadow-sky-500/40">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer CTA if unauthenticated */}
                    {!user && (
                      <div className="p-3 border-t border-white/[0.08] bg-white/[0.02] flex gap-2">
                        <button 
                          onClick={() => openAuth('login')} 
                          className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium py-2 rounded-xl transition-all cursor-pointer text-xs shadow-md shadow-blue-500/20"
                        >
                          Giriş Yap
                        </button>
                        <button 
                          onClick={() => openAuth('register')} 
                          className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium py-2 rounded-xl transition-all border border-white/10 cursor-pointer text-xs"
                        >
                          Kayıt Ol
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button 
            onClick={onNewChat} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all hidden sm:flex items-center gap-1.5 cursor-pointer text-xs font-medium border border-transparent hover:border-white/10" 
            title="Yeni Sohbet Başlat"
          >
            <MessageSquarePlus className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Yeni Sohbet</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              {/* Admin Button (Only for verified Admin) */}
              {isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                  title="Yönetici Paneli"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              {/* Profile button */}
              <button 
                onClick={() => onOpenProfile('profile')}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10"
                title="Profil ve Ayarlar"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-tr from-blue-600 to-sky-400 border border-white/20 flex items-center justify-center shadow-sm">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-200 font-medium hidden md:block max-w-[110px] truncate">
                  {profile?.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              <button 
                onClick={signOut} 
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer" 
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openAuth('login')} 
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-xs sm:text-sm cursor-pointer shadow-md shadow-blue-600/30"
              >
                Giriş yap
              </button>
              <button 
                onClick={() => openAuth('register')} 
                className="hidden sm:block bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 text-zinc-200 border border-white/10 font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
              >
                Kayıt ol
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </>
  );
}
