import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronDown, 
  MessageSquarePlus, 
  X, 
  User as UserIcon, 
  PanelLeftOpen, 
  LogOut,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Model, AVAILABLE_MODELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';

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

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors lg:hidden cursor-pointer"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-zinc-200 font-medium text-lg cursor-pointer"
            >
              {selectedModel.name}
              <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isModelDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isModelDropdownOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 md:hidden bg-black/50"
                    onClick={() => setIsModelDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] md:w-96 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-medium text-zinc-200">Modeller</h3>
                      <button onClick={() => setIsModelDropdownOpen(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                      {AVAILABLE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            if (model.disabled) return;
                            onModelSelect(model);
                            setIsModelDropdownOpen(false);
                          }}
                          disabled={model.disabled}
                          className={cn(
                            "w-full text-left p-3 rounded-xl transition-colors flex items-start gap-3 group relative cursor-pointer",
                            selectedModel.id === model.id ? "bg-white/5" : "hover:bg-white/5",
                            model.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                          )}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-zinc-200 mb-1 flex items-center gap-2">
                              {model.name}
                            </div>
                            <div className="text-sm text-zinc-500 leading-snug">{model.description}</div>
                          </div>
                          {selectedModel.id === model.id && (
                            <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>
                    {!user && (
                      <div className="p-4 border-t border-white/5 flex gap-3">
                        <button onClick={() => openAuth('login')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors cursor-pointer text-sm">
                          Giriş yap
                        </button>
                        <button onClick={() => openAuth('register')} className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-200 font-medium py-2.5 rounded-xl transition-colors border border-white/5 cursor-pointer text-sm">
                          Kayıt ol
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onNewChat} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors hidden lg:block cursor-pointer" 
            title="Yeni Sohbet"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              {/* Admin Button (Only visible for verified Admin) */}
              {isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Yönetici Paneli"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              {/* Profile button */}
              <button 
                onClick={() => onOpenProfile('profile')}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                title="Profil ve Ayarlar"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600/20 border border-white/10 flex items-center justify-center">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-300 font-medium hidden md:block max-w-[120px] truncate">
                  {profile?.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              <button 
                onClick={signOut} 
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer" 
                title="Çıkış yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openAuth('login')} 
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-xs sm:text-sm cursor-pointer shadow-sm shadow-blue-600/30"
              >
                Giriş yap
              </button>
              <button 
                onClick={() => openAuth('register')} 
                className="hidden sm:block bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-200 border border-white/10 font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
              >
                Kayıt ol
              </button>
            </div>
          )}
          
          {user && (
            <button 
              onClick={onNewChat} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors lg:hidden cursor-pointer" 
              title="Yeni Sohbet"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
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
