import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquarePlus, 
  Search, 
  Pin, 
  Settings, 
  PanelLeftClose, 
  Plus, 
  Trash2, 
  Edit2, 
  MoreVertical,
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Chat, getUserChats, deleteChat, toggleChatPin, updateChatTitle } from '../../lib/firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { WnelLogo } from '../common/WnelLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
  onOpenProfile: (tab?: 'profile' | 'account' | 'notifications' | 'appearance') => void;
  onOpenAdmin: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onSelectChat, 
  currentChatId,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuth
}: SidebarProps) {
  const { user, profile, isAdmin } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
    }
  }, [user, currentChatId]);

  useEffect(() => {
    const handleChatUpdated = () => {
      loadChats();
    };
    window.addEventListener('chat-updated', handleChatUpdated);
    return () => window.removeEventListener('chat-updated', handleChatUpdated);
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleDelete = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        onNewChat();
      } else {
        loadChats();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleTogglePin = async (chatId: string, isPinned: boolean) => {
    try {
      await toggleChatPin(chatId, !isPinned);
      loadChats();
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleRenameSubmit = async (chatId: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await updateChatTitle(chatId, editTitle.trim());
      setEditingChatId(null);
      loadChats();
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const startRename = (chat: Chat) => {
    setEditTitle(chat.title);
    setEditingChatId(chat.id);
    setActiveMenuId(null);
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned);

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const isSelected = currentChatId === chat.id;

    return (
      <div className="relative group w-full my-0.5">
        <div 
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer border",
            isSelected 
              ? "bg-sky-500/15 border-sky-500/30 text-white font-medium shadow-[0_0_15px_rgba(56,189,248,0.15)]" 
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          )} 
          onClick={() => { if (editingChatId !== chat.id) onSelectChat(chat.id); }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden pr-6">
            {chat.isPinned ? (
              <Pin className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-sky-400" : "text-zinc-500 group-hover:text-sky-400/70")} />
            ) : (
              <MessageSquare className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isSelected ? "text-sky-400" : "text-zinc-500 group-hover:text-zinc-400")} />
            )}
            
            {editingChatId === chat.id ? (
              <input
                type="text"
                value={editTitle}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(chat.id);
                  if (e.key === 'Escape') setEditingChatId(null);
                }}
                onBlur={() => handleRenameSubmit(chat.id)}
                className="flex-1 bg-black/60 border border-sky-400 rounded-lg px-2 py-0.5 outline-none text-white w-full text-xs"
              />
            ) : (
              <span className="truncate">{chat.title || 'Yeni Sohbet'}</span>
            )}
          </div>

          <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
              }}
              className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activeMenuId === chat.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute right-0 top-9 w-44 bg-[#0c1222]/95 backdrop-blur-xl border border-sky-500/20 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-1.5 flex flex-col gap-0.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleTogglePin(chat.id, chat.isPinned); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{chat.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); startRename(chat); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Yeniden adlandır</span>
                </button>
                <div className="h-px bg-white/[0.08] my-1" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Sohbeti Sil</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { onClose(); setActiveMenuId(null); }}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-md"
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
          x: isOpen ? 0 : -20
        }}
        className={cn(
          "fixed lg:relative top-0 left-0 h-[100dvh] bg-[#070b16]/95 backdrop-blur-2xl border-r border-white/[0.07] z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          !isOpen && "lg:border-r-0 pointer-events-none lg:pointer-events-auto"
        )}
        onClick={() => setActiveMenuId(null)}
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Brand header */}
          <div className="p-4 flex items-center justify-between border-b border-white/[0.07]">
            <WnelLogo size="sm" showText={true} showBadge={true} />
            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
              title="Menüyü Kapat"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-3.5 pt-3.5 pb-2">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-sky-500/10 via-blue-600/10 to-sky-500/10 hover:from-sky-500/20 hover:to-blue-600/20 border border-sky-500/25 hover:border-sky-500/40 rounded-xl text-sky-200 hover:text-white transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-sky-500/20 border border-sky-500/30 p-1 rounded-lg text-sky-400 group-hover:scale-110 transition-transform">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs tracking-wide">Yeni Sohbet</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-sky-400/60 group-hover:text-sky-300 transition-colors" />
            </button>
          </div>

          {/* Search */}
          {user && (
            <div className="px-3.5 py-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sohbetlerde ara..." 
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/40 focus:bg-sky-950/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
            {user ? (
              <>
                {pinnedChats.length > 0 && (
                  <div className="mb-4">
                    <h4 className="px-3 text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Pin className="w-3 h-3" />
                      <span>Sabitlenenler</span>
                    </h4>
                    <div className="space-y-0.5">
                      {pinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {unpinnedChats.length > 0 && (
                  <div>
                    <h4 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                      Geçmiş Sohbetler
                    </h4>
                    <div className="space-y-0.5">
                      {unpinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {chats.length === 0 && !searchQuery && (
                  <div className="text-center px-4 py-10 text-zinc-500 text-xs">
                    Henüz kayıtlı sohbet bulunmuyor.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center px-4 py-10 text-zinc-500 text-xs">
                Sohbet geçmişinizi kaydetmek için giriş yapın.
              </div>
            )}
          </div>

          {/* Bottom user profile & settings controls */}
          <div className="p-3 border-t border-white/[0.07] space-y-1.5 bg-[#060913]/90">
            {/* Admin panel button ONLY visible if user is authenticated admin */}
            {user && isAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="flex-1 text-left">Yönetici Paneli</span>
                <span className="text-[10px] bg-sky-500/30 px-1.5 py-0.5 rounded text-sky-200">Admin</span>
              </button>
            )}

            {user ? (
              <>
                <button 
                  onClick={() => onOpenProfile('profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer text-left border border-transparent hover:border-white/10"
                >
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-gradient-to-tr from-blue-600 to-sky-400 border border-white/15 flex items-center justify-center shrink-0">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[11px] font-bold">
                        {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-white text-xs">{profile?.displayName || user.email?.split('@')[0]}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                  </div>
                </button>

                <button 
                  onClick={() => onOpenProfile('appearance')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium">Ayarlar & Görünüm</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1 pb-1">
                <div className="text-center text-[11px] text-zinc-400 font-medium">
                  Sohbetlerinizi kaydetmek için
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onOpenAuth('login')}
                    className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center shadow-sm"
                  >
                    Giriş yap
                  </button>
                  <button 
                    onClick={() => onOpenAuth('register')}
                    className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-200 rounded-xl text-xs font-medium transition-all cursor-pointer text-center"
                  >
                    Kayıt ol
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
