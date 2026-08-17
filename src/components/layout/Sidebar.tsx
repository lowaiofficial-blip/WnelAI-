import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquarePlus, 
  Search, 
  Pin, 
  Settings, 
  User as UserIcon, 
  PanelLeftClose, 
  Plus, 
  Trash2, 
  Edit2, 
  MoreVertical,
  ShieldCheck,
  LogOut
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
  const { user, profile, isAdmin, signOut } = useAuth();
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

  const ChatItem = ({ chat }: { chat: Chat }) => (
    <div className="relative group w-full">
      <div 
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
          currentChatId === chat.id ? "bg-white/10 text-white" : "text-zinc-300 hover:text-white hover:bg-white/5"
        )} 
        onClick={() => { if (editingChatId !== chat.id) onSelectChat(chat.id); }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden pr-6">
          {chat.isPinned ? (
            <Pin className={cn("w-4 h-4 shrink-0", currentChatId === chat.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400")} />
          ) : (
            <MessageSquarePlus className="w-4 h-4 shrink-0 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              className="flex-1 bg-black/50 border border-blue-500 rounded px-2 py-0.5 outline-none text-white w-full text-xs"
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
            className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeMenuId === chat.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-10 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-1 flex flex-col">
              <button 
                onClick={(e) => { e.stopPropagation(); handleTogglePin(chat.id, chat.isPinned); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Pin className="w-3.5 h-3.5" />
                {chat.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); startRename(chat); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Yeniden adlandır
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { onClose(); setActiveMenuId(null); }}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
          x: isOpen ? 0 : -20
        }}
        className={cn(
          "fixed md:relative top-0 left-0 h-[100dvh] bg-[#0a0a0a] border-r border-white/5 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          !isOpen && "md:border-r-0 pointer-events-none md:pointer-events-auto"
        )}
        onClick={() => setActiveMenuId(null)}
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Brand header with centralized logo */}
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <WnelLogo size="sm" showText={true} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-2">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-200 transition-colors group cursor-pointer"
            >
              <div className="bg-white/10 p-1 rounded-lg group-hover:bg-white/20 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Yeni Sohbet</span>
            </button>
          </div>

          {/* Search */}
          {user && (
            <div className="px-3 py-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sohbetlerde ara..." 
                  className="w-full bg-[#18181b] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all"
                />
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
            {user ? (
              <>
                {pinnedChats.length > 0 && (
                  <div className="mb-4">
                    <h4 className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Sabitlenenler</h4>
                    <div className="space-y-0.5">
                      {pinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {unpinnedChats.length > 0 && (
                  <div>
                    <h4 className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Geçmiş Sohbetler</h4>
                    <div className="space-y-0.5">
                      {unpinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {chats.length === 0 && !searchQuery && (
                  <div className="text-center px-4 py-8 text-zinc-500 text-xs">
                    Henüz sohbet bulunmuyor.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center px-4 py-8 text-zinc-500 text-xs">
                Sohbet geçmişinizi görmek için giriş yapın.
              </div>
            )}
          </div>

          {/* Bottom user profile & settings controls */}
          <div className="p-3 border-t border-white/5 space-y-1 bg-[#0e0e10]/80">
            {/* Admin panel button ONLY visible if user is authenticated admin */}
            {user && isAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all mb-1 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="flex-1 text-left">Yönetici Paneli</span>
                <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-300">Admin</span>
              </button>
            )}

            {user ? (
              <>
                <button 
                  onClick={() => onOpenProfile('profile')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-blue-600/20 border border-white/10 flex items-center justify-center shrink-0">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[11px] font-bold">
                        {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-white">{profile?.displayName || user.email?.split('@')[0]}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                  </div>
                </button>

                <button 
                  onClick={() => onOpenProfile('appearance')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium">Ayarlar</span>
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
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Giriş yap
                  </button>
                  <button 
                    onClick={() => onOpenAuth('register')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 rounded-xl text-xs font-medium transition-colors cursor-pointer text-center"
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
