const fs = require('fs');
const newContent = `import React, { useEffect, useState } from 'react';
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
  MessageSquare,
  Zap,
  Brain,
  User,
  Menu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Chat, getUserChats, deleteChat, toggleChatPin, updateChatTitle } from '../../lib/firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { WnelLogo } from '../common/WnelLogo';
import { Model, AVAILABLE_MODELS } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  currentChatId: string | null;
  onOpenProfile: (tab?: 'profile' | 'account' | 'notifications' | 'appearance') => void;
  onOpenAdmin: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onSelectChat, 
  currentChatId,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuth,
  selectedModel,
  onModelSelect
}: SidebarProps) {
  const { user, profile, isAdmin } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = getUserChats(user.uid, (fetchedChats) => {
        setChats(fetchedChats);
      });
      return () => unsubscribe();
    } else {
      setChats([]);
    }
  }, [user]);

  const handleEditTitle = async (e: React.KeyboardEvent | React.FocusEvent, chatId: string) => {
    if ((e as React.KeyboardEvent).key === 'Enter' || e.type === 'blur') {
      if (editTitle.trim()) {
        await updateChatTitle(chatId, editTitle.trim());
      }
      setEditingChatId(null);
    }
  };

  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setActiveMenuId(null);
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned);

  const ChatItem = ({ chat }: { chat: Chat }) => (
    <div className="relative group">
      <button
        onClick={() => {
          onSelectChat(chat.id);
          // Auto close sidebar on mobile after selection
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative overflow-hidden group/btn",
          currentChatId === chat.id 
            ? "bg-sky-500/10 text-sky-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-sky-500/20" 
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
        )}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-6">
          <MessageSquare className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors",
            currentChatId === chat.id ? "text-sky-400" : "text-zinc-500 group-hover/btn:text-zinc-400"
          )} />
          {editingChatId === chat.id ? (
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => handleEditTitle(e, chat.id)}
              onBlur={(e) => handleEditTitle(e, chat.id)}
              className="flex-1 bg-black/40 border border-sky-500/30 rounded px-1.5 py-0.5 text-sm text-white outline-none focus:border-sky-500/60"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-[13.5px] tracking-wide font-medium">
              {chat.title}
            </span>
          )}
        </div>
        
        {chat.isPinned && currentChatId !== chat.id && (
          <Pin className="w-3 h-3 text-sky-500/50 absolute right-3 shrink-0" />
        )}
      </button>

      {/* Hover Actions Menu */}
      <div className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#121212] via-[#121212] to-transparent pl-4 pr-1 py-1 rounded-r-xl",
        (activeMenuId === chat.id || editingChatId === chat.id) && "opacity-100 z-10",
        currentChatId === chat.id && "from-[#111A2C] via-[#111A2C]"
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleChatPin(chat.id, !chat.isPinned);
          }}
          className="p-1.5 text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
          title={chat.isPinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
        >
          <Pin className={cn("w-3.5 h-3.5", chat.isPinned && "fill-sky-400 text-sky-400")} />
        </button>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
            }}
            className={cn(
              "p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors",
              activeMenuId === chat.id && "bg-white/10 text-white"
            )}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {activeMenuId === chat.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(chat);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Yeniden Adlandır
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Bu sohbeti silmek istediğinize emin misiniz?")) {
                      await deleteChat(chat.id);
                      if (currentChatId === chat.id) {
                        onNewChat();
                      }
                    }
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sohbeti Sil
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -320,
          opacity: isOpen ? 1 : 0.5
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={cn(
          "fixed md:relative top-0 left-0 h-full w-[280px] sm:w-[320px] z-50 flex flex-col transition-all",
          "bg-[#0a0a0a]/90 backdrop-blur-3xl border-r border-white/[0.08] shadow-[4px_0_24px_rgba(0,0,0,0.5)] md:shadow-none"
        )}
      >
        {/* Header - WnelAI Brand */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <WnelLogo size="sm" withGlow={true} />
            <span className="text-base font-bold tracking-wide text-white select-none">WnelAI</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden px-3">
          
          {/* New Chat Button */}
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full mt-4 flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/10 rounded-2xl transition-all group shadow-sm cursor-pointer"
          >
            <span className="font-semibold text-[14px] text-zinc-100 tracking-wide">Yeni Sohbet</span>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Model Selector (Fast vs Thinking) */}
          <div className="mt-4 bg-[#111111]/80 rounded-2xl p-1.5 border border-white/5 flex gap-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = selectedModel.id === model.id;
              const isThinking = model.name.includes("Düşünen");
              return (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer",
                    isSelected 
                      ? isThinking 
                        ? "bg-indigo-500/20 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-indigo-500/30"
                        : "bg-sky-500/20 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-sky-500/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                  )}
                  title={model.description}
                >
                  {isThinking ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {model.name}
                </button>
              );
            })}
          </div>

          {/* Search */}
          {user && chats.length > 0 && (
            <div className="mt-4 relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text"
                placeholder="Sohbetlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-white/5 focus:border-sky-500/30 focus:bg-[#151515] rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-5 scrollbar-none pb-4">
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center pb-10">
                <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
                  <MessageSquarePlus className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="text-zinc-200 font-medium mb-2">Sohbet Geçmişi</h3>
                <p className="text-zinc-500 text-[13px] leading-relaxed mb-6">
                  Önceki sohbetlerinizi görmek ve kaydetmek için giriş yapın.
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-[200px]">
                  <button 
                    onClick={() => onOpenAuth("login")}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Giriş Yap
                  </button>
                  <button 
                    onClick={() => onOpenAuth("register")}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Kayıt Ol
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Pinned Chats */}
                {pinnedChats.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Sabitlenmiş</h3>
                    <div className="space-y-0.5">
                      {pinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Chats */}
                {unpinnedChats.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">
                      {searchQuery ? 'Sonuçlar' : 'Geçmiş'}
                    </h3>
                    <div className="space-y-0.5">
                      {unpinnedChats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} />
                      ))}
                    </div>
                  </div>
                )}

                {chats.length === 0 && !searchQuery && (
                  <div className="flex flex-col items-center justify-center h-full text-center pb-10 px-4">
                    <MessageSquare className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500 font-medium">Henüz mesajınız yok.</p>
                  </div>
                )}
                
                {searchQuery && filteredChats.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-zinc-500">Sonuç bulunamadı.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* User Profile & Settings Area (Bottom) */}
        <div className="p-4 border-t border-white/[0.05] bg-[#0a0a0a]">
          {user ? (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onOpenProfile('profile')}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  {profile?.displayName?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[14px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                    {profile?.displayName || profile?.username || 'Kullanıcı'}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    Hesabı Yönet
                  </div>
                </div>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenProfile('appearance')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Ayarlar
                </button>
                {isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber-400/80 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 rounded-xl transition-all cursor-pointer border border-amber-500/20"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="pb-1">
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Giriş Yap / Kayıt Ol
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
`;
fs.writeFileSync('src/components/layout/Sidebar.tsx', newContent);
console.log('Sidebar patched successfully');
