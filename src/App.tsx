import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageBubble } from './components/chat/MessageBubble';
import { InputArea } from './components/chat/InputArea';
import { ThinkingAnimation } from './components/chat/ThinkingAnimation';
import { TypingAnimation } from './components/chat/TypingAnimation';
import { Message, Model, AVAILABLE_MODELS } from './types';
import { 
  Loader2, 
  Ban, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Mail, 
  ArrowDown, 
  Clock, 
  Lock, 
  AlertCircle, 
  X,
  Image as ImageIcon,
  PenLine,
  Globe,
  Code2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { createChat, addMessageToChat, getChatMessages, updateChatTitle, claimVipCampaign } from './lib/firebase/firestore';
import { WnelLogo } from './components/common/WnelLogo';
import { WnelGoModal } from './components/common/WnelGoModal';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { AdminPanelModal } from './components/admin/AdminPanelModal';
import { AuthModal } from './components/auth/AuthModal';
import { ModelSelectorSheet } from './components/chat/ModelSelectorSheet';
import { VoiceModeModal } from './components/chat/VoiceModeModal';
import { TestAccessGate } from './components/auth/TestAccessGate';
import { 
  getThinkingCooldownUntil, 
  setThinkingCooldown, 
  getThinkingLimitMessage, 
  getIstanbulFormattedTime,
  formatRemainingTime 
} from './lib/thinkingCooldown';
import { checkChatLimit, checkThinkingLimit, incrementDailyUsage } from './lib/usageLimits';

export default function App() {
  const { user, profile, isAdmin, updateProfileData, isGo } = useAuth();
  const [hasTestAccess, setHasTestAccess] = useState<boolean>(() => {
    return localStorage.getItem('wnelai_test_access_granted') === 'true';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [thinkingCooldownUntil, setThinkingCooldownUntil] = useState<number>(() => {
    return getThinkingCooldownUntil(user?.uid, profile?.thinkingCooldownUntil);
  });
  const [selectedModel, setSelectedModel] = useState<Model>(AVAILABLE_MODELS[0]);
  const [cooldownToast, setCooldownToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'account' | 'notifications' | 'appearance'>('profile');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isGoModalOpen, setIsGoModalOpen] = useState(false);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  
  // Intelligent Scroll State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [hasNewUnreadMessages, setHasNewUnreadMessages] = useState(false);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
      isAtBottomRef.current = true;
      setShowScrollBottomButton(false);
      setHasNewUnreadMessages(false);
    }
  }, []);

  // Handle scroll events in messages container
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Distance from bottom in px
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom <= 120;

    isAtBottomRef.current = isNearBottom;

    if (isNearBottom) {
      setShowScrollBottomButton(false);
      setHasNewUnreadMessages(false);
    } else {
      setShowScrollBottomButton(true);
    }
  }, []);

  // Keep scroll at bottom on new updates ONLY IF user is already at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      if (scrollContainerRef.current) {
        // Instant follow without jittering during streaming
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    } else {
      // User is scrolled up reading previous messages
      if (messages.length > 0) {
        setHasNewUnreadMessages(true);
      }
    }
  }, [messages, isLoading]);

  // Periodic ticker & account sync for thinking mode cooldown
  useEffect(() => {
    const checkCooldown = () => {
      const until = getThinkingCooldownUntil(user?.uid, profile?.thinkingCooldownUntil);
      setThinkingCooldownUntil(until);
      if (until > Date.now()) {
        // If locked and currently selected model is thinking, force back to fast
        setSelectedModel(prev => {
          if (prev.id.includes('deepseek') || prev.name.includes('Düşünen')) {
            return AVAILABLE_MODELS[0];
          }
          return prev;
        });
      }
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 2000);
    return () => clearInterval(interval);
  }, [user?.uid, profile?.thinkingCooldownUntil]);

  const showThinkingLockedAlert = (until?: number) => {
    const timestamp = until || thinkingCooldownUntil || (Date.now() + 3 * 3600 * 1000);
    const msg = getThinkingLimitMessage(timestamp);
    setCooldownToast({ message: msg, visible: true });
  };

  const handleModelSelect = (model: Model) => {
    const isThinking = model.name.includes("Düşünen") || model.id.includes("deepseek");
    if (isThinking && thinkingCooldownUntil > Date.now()) {
      showThinkingLockedAlert(thinkingCooldownUntil);
      setSelectedModel(AVAILABLE_MODELS[0]);
      return;
    }
    setSelectedModel(model);
  };

  // Support URL hash #admin
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminPanelOpen(true);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenProfile = (tab: 'profile' | 'account' | 'notifications' | 'appearance' = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };

  const handleOpenAdmin = () => {
    setIsAdminPanelOpen(true);
  };

  const handleCloseAdmin = () => {
    setIsAdminPanelOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    isAtBottomRef.current = true;
  };

  const handleSelectChat = async (chatId: string) => {
    if (currentChatId === chatId) return;
    setCurrentChatId(chatId);
    setIsChatLoading(true);
    isAtBottomRef.current = true;
    try {
      const dbMessages = await getChatMessages(chatId);
      setMessages(dbMessages.map(m => ({
        id: m.id || Date.now().toString(),
        role: m.role,
        content: m.content
      })));
      setTimeout(() => scrollToBottom('auto'), 50);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsChatLoading(false);
    }
  };


  const handleRegenerateMessage = async (messageId: string) => {
    if (profile?.isBanned || isLoading) return;
    
    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Get the AI message and the user message before it
    const aiMessage = messages[msgIndex];
    if (aiMessage.role !== 'ai') return;

    // Remove the AI message and all messages after it, effectively resetting state to right after the user prompt
    const newMessages = messages.slice(0, msgIndex);
    setMessages(newMessages);
    
    // Call the API again with the previous messages
    setIsLoading(true);
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 20);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          model: selectedModel.id 
        })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let assistantMessage: Message = { id: Date.now().toString(), role: 'ai', content: '', isStreaming: true };
        setMessages(prev => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(5));
                assistantMessage.content += data.text;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { ...assistantMessage }
                ]);
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        assistantMessage.isStreaming = false;
        setMessages(prev => [
          ...prev.slice(0, -1),
          assistantMessage
        ]);

        if (user && currentChatId && assistantMessage.content) {
          await addMessageToChat(currentChatId, 'ai', assistantMessage.content);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: '*(Bağlantı kesildi veya bir hata oluştu. Lütfen tekrar deneyin.)*' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (profile?.isBanned) {
      return;
    }

    const trimmedContent = content.trim();
    const userPlan = profile?.plan === 'go' ? 'go' : 'free';

    // 1. VIP CLAIM COMMAND: /claimvip
    if (trimmedContent.toLowerCase() === '/claimvip') {
      const userMessage: Message = { id: Date.now().toString(), role: 'user', content: trimmedContent };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom('smooth'), 20);

      try {
        let activeChatId = currentChatId;
        if (user && !activeChatId) {
          activeChatId = await createChat(user.uid, "VIP Başvurusu");
          setCurrentChatId(activeChatId);
        }
        if (user && activeChatId) {
          await addMessageToChat(activeChatId, 'user', trimmedContent);
        }

        let aiReply = '';
        if (!user) {
          aiReply = "⚠️ VIP başvurusunda bulunabilmek için lütfen önce giriş yapın.";
        } else {
          const claimResult = await claimVipCampaign(
            user.uid,
            user.email || '',
            profile?.displayName || user.displayName || 'Kullanıcı',
            profile?.username || ''
          );

          if (claimResult.status === 'success') {
            aiReply = `🎉 Tebrikler! İlk 5 kişilik WnelAI Go VIP kontenjanına girdiniz (#${claimResult.orderNumber}).\nAdmin onayından sonra üyeliğiniz aktifleştirilecektir.`;
          } else if (claimResult.status === 'already_claimed') {
            aiReply = "ℹ️ Zaten VIP başvurunuz bulunmaktadır. Durum: Onay Bekliyor / Aktif";
          } else if (claimResult.status === 'quota_full') {
            aiReply = "😔 Maalesef ilk 5 kişilik VIP kontenjanı doldu.\nDaha sonraki etkinliklerimizi takip edin!";
          } else {
            aiReply = `⚠️ VIP başvuru işlemi sırasında bir sorun oluştu: ${claimResult.message || 'Lütfen tekrar deneyin.'}`;
          }
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: aiReply,
          isStreaming: false
        };
        setMessages(prev => [...prev, aiMsg]);
        if (user && activeChatId) {
          await addMessageToChat(activeChatId, 'ai', aiReply);
        }
      } catch (err) {
        console.error("Error executing /claimvip:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. CHECK CHAT LIMIT
    const chatLimitCheck = checkChatLimit(userPlan, user?.uid);
    if (!chatLimitCheck.allowed) {
      setCooldownToast({
        message: `🚀 Günlük mesaj limitiniz dolmuştur (${chatLimitCheck.limit}/${chatLimitCheck.limit}). Sınırsız sohbet için WnelAI Go'ya geçebilirsiniz.`,
        visible: true
      });
      setIsGoModalOpen(true);
      return;
    }

    // 3. CHECK THINKING LIMIT
    const isThinkingMode = selectedModel.id.includes('deepseek') || selectedModel.id.includes('coder') || selectedModel.id.includes('r1') || selectedModel.name.includes('Düşünen');
    if (isThinkingMode) {
      const thinkingLimitCheck = checkThinkingLimit(userPlan, user?.uid, profile?.thinkingCooldownUntil);
      if (!thinkingLimitCheck.allowed) {
        if (thinkingLimitCheck.reason === 'daily_limit') {
          setCooldownToast({
            message: `🧠 WnelAI Go günlük Düşünen Mod limitiniz doldu (${thinkingLimitCheck.limitToday}/${thinkingLimitCheck.limitToday}).`,
            visible: true
          });
        } else {
          showThinkingLockedAlert(thinkingLimitCheck.cooldownUntil);
        }
        setSelectedModel(AVAILABLE_MODELS[0]);
        return;
      }
    }

    let activeChatId = currentChatId;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 20);

    try {
      let isNewChat = false;
      if (user) {
        if (!activeChatId) {
          isNewChat = true;
          activeChatId = await createChat(user.uid, "Yeni Sohbet");
          setCurrentChatId(activeChatId);
        }
        await addMessageToChat(activeChatId, 'user', content);
      }

      // Record chat usage
      incrementDailyUsage(user?.uid, 'chat');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model: selectedModel.id }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const aiMessageId = (Date.now() + 1).toString();
      
      // If thinking mode was used, record thinking usage and handle plan-specific cooldown
      if (isThinkingMode) {
        incrementDailyUsage(user?.uid, 'thinking');

        if (userPlan === 'free') {
          // Free users get 3-hour cooldown
          const unlockTimestamp = setThinkingCooldown(user?.uid);
          setThinkingCooldownUntil(unlockTimestamp);
          setSelectedModel(AVAILABLE_MODELS[0]);
          showThinkingLockedAlert(unlockTimestamp);
          if (user) {
            updateProfileData({ thinkingCooldownUntil: unlockTimestamp }).catch(e => {
              console.warn("Could not save thinkingCooldownUntil to Firestore:", e);
            });
          }
        }
      }

      let fullResponse = '';
      let isTimerDone = !isThinkingMode;
      let streamQueue = '';
      let isStreamFinished = false;
      let displayedContent = '';
      let hasAddedMessage = false;

      // Start the thinking timer (6 seconds for thinking steps)
      const thinkingTimer = isThinkingMode 
        ? new Promise<void>(resolve => setTimeout(() => {
            isTimerDone = true;
            resolve();
          }, 6000)) 
        : Promise.resolve();

      const renderLoop = async () => {
        while (!isStreamFinished || streamQueue.length > 0) {
          if (isTimerDone && streamQueue.length > 0) {
            if (!hasAddedMessage) {
              hasAddedMessage = true;
              setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isStreaming: true }]);
            }
            // Dynamic pacing based on queue size to catch up smoothly but naturally
            const charsToTake = streamQueue.length > 500 ? 48 : (streamQueue.length > 150 ? 20 : (streamQueue.length > 50 ? 8 : 3));
            const chunk = streamQueue.slice(0, charsToTake);
            streamQueue = streamQueue.slice(charsToTake);
            displayedContent += chunk;
            
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId ? { ...msg, content: displayedContent } : msg
            ));
            
            await new Promise(r => setTimeout(r, 25));
          } else if (isTimerDone && isStreamFinished && streamQueue.length === 0) {
            break;
          } else {
            // Check again shortly
            await new Promise(r => setTimeout(r, 50));
          }
        }
      };

      // Process stream in background
      const processStream = async () => {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep the last incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                isStreamFinished = true;
                return true;
              }
              try {
                const parsed = JSON.parse(data);
                fullResponse += parsed.text;
                streamQueue += parsed.text;

                // Safety violation: cancel timer immediately and display error
                if (fullResponse.includes('[[SAFETY_VIOLATION_ERROR]]')) {
                  isTimerDone = true;
                  if (!hasAddedMessage) {
                    hasAddedMessage = true;
                    setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '[[SAFETY_VIOLATION_ERROR]]', isStreaming: false }]);
                  }
                }

                // Fast mode: show typing indicator until first bytes arrive, then add message object
                if (!isThinkingMode && !hasAddedMessage && streamQueue.length > 0) {
                  hasAddedMessage = true;
                  setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isStreaming: true }]);
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
        isStreamFinished = true;
        return true;
      };

      await Promise.all([processStream(), thinkingTimer, renderLoop()]);

      // When everything is done, mark as not streaming
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, isStreaming: false, content: fullResponse } : msg
      ));
      
      if (user && activeChatId) {
        await addMessageToChat(activeChatId, 'ai', fullResponse);
        
        // Generate title if new chat
        if (isNewChat) {
          fetch('/api/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...newMessages, { id: 'ai-final', role: 'ai', content: fullResponse }] })
          })
          .then(res => res.json())
          .then(async (data) => {
            if (data.title) {
              await updateChatTitle(activeChatId, data.title);
              window.dispatchEvent(new CustomEvent('chat-updated'));
            }
          })
          .catch(err => console.error("Title generation error", err));
        }
      }
      return fullResponse;
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: 'Bir hata oluştu. Lütfen tekrar deneyin.' 
      }]);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen wnel-ambient-bg text-zinc-200 overflow-hidden font-sans antialiased selection:bg-sky-500/30">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
        selectedModel={selectedModel}
        onModelSelect={handleModelSelect}
        thinkingCooldownUntil={thinkingCooldownUntil}
        onThinkingLockedClick={() => showThinkingLockedAlert()}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        <Header 
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          onOpenProfile={handleOpenProfile}
          onOpenAdmin={handleOpenAdmin}
          onOpenGoModal={() => setIsGoModalOpen(true)}
          onOpenModelSheet={() => setIsModelSheetOpen(true)}
          onOpenAuth={handleOpenAuth}
        />

        {/* Banned banner if user is suspended */}
        {profile?.isBanned && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-red-400">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0" />
              <span>
                <strong>Hesabınız Askıya Alındı:</strong> {profile.banReason || 'Topluluk kurallarına aykırı işlem sebebiyle işlem yapmanız kısıtlanmıştır.'}
              </span>
            </div>
            <button 
              onClick={() => handleOpenProfile('account')}
              className="underline hover:text-red-300 font-medium"
            >
              Detaylar
            </button>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pt-4 pb-36 relative scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-4 w-full flex flex-col gap-6">
            {!user ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <h1 className="text-2.5xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                    Ne bilmek istiyorsunuz?
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Soru sorun, kod yazın, fikir üretin veya görseller hakkında tartışın.
                  </p>
                </div>

                {/* Central responsive action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-sm">
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-semibold py-3 px-5 rounded-full shadow-lg shadow-blue-600/25 transition-all text-sm cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Giriş Yap</span>
                  </button>
                  <button
                    onClick={() => handleOpenAuth('register')}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-zinc-200 font-medium py-3 px-5 rounded-full transition-all text-sm cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Kayıt Ol</span>
                  </button>
                </div>
              </div>
            ) : user && !user.emailVerified ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                <div className="bg-[#141418] border border-white/10 rounded-3xl p-8 text-center max-w-md shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">E-posta doğrulaması gerekli</h2>
                  <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                    Sohbet edebilmek ve tüm özellikleri kullanabilmek için lütfen e-posta adresinize gelen doğrulama bağlantısına tıklayın.
                  </p>
                  <div className="text-xs text-zinc-500 bg-white/5 py-2 px-3 rounded-xl border border-white/5">
                    Gelen kutunuzu (ve gerekiyorsa spam klasörünü) kontrol edin.
                  </div>
                </div>
              </div>
            ) : isChatLoading ? (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] text-center select-none">
                {/* Center Title (Screenshot 2 & 3: "Ne bilmek istiyorsunuz?") */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-8">
                  Ne bilmek istiyorsunuz?
                </h1>

                {/* Quick Prompts Grid / List (Screenshot 1 style: Görsel oluştur, Yaz veya düzenle, Web'de arama yap) */}
                <div className="w-full max-w-md flex flex-col gap-2.5 text-left">
                  <button
                    onClick={() => handleSendMessage("Bana fütüristik bir şehir görseli tasarlayabilir misin?")}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-[#16161c]/90 hover:bg-[#20202a] border border-white/[0.06] hover:border-white/20 text-zinc-200 hover:text-white transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-sky-300 group-hover:bg-sky-500/10 transition-colors">
                      <ImageIcon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-[14px] font-medium tracking-tight">Görsel oluştur</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Profesyonel bir e-posta taslağı yazmama yardımcı olur musun?")}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-[#16161c]/90 hover:bg-[#20202a] border border-white/[0.06] hover:border-white/20 text-zinc-200 hover:text-white transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-amber-300 group-hover:bg-amber-500/10 transition-colors">
                      <PenLine className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-[14px] font-medium tracking-tight">Yaz veya düzenle</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Güncel teknoloji ve yapay zeka trendleri hakkında bilgi ver.")}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-[#16161c]/90 hover:bg-[#202028] border border-white/[0.06] hover:border-white/20 text-zinc-200 hover:text-white transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/10 transition-colors">
                      <Globe className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-[14px] font-medium tracking-tight">Web'de arama yap</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Modern bir React ve TypeScript kanca (custom hook) örneği yazar mısın?")}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-[#16161c]/90 hover:bg-[#202028] border border-white/[0.06] hover:border-white/20 text-zinc-200 hover:text-white transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10 transition-colors">
                      <Code2 className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-[14px] font-medium tracking-tight">Kod yaz veya analiz et</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <MessageBubble key={message.id} message={message} onRegenerate={!isLoading && message.role === "ai" ? () => handleRegenerateMessage(message.id) : undefined} />
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (selectedModel.id.includes('deepseek') || selectedModel.id.includes('coder') || selectedModel.id.includes('r1') || selectedModel.name.includes('Düşünen')) && (
              <ThinkingAnimation query={messages[messages.length - 1]?.content || ''} />
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && !(selectedModel.id.includes('deepseek') || selectedModel.id.includes('coder') || selectedModel.id.includes('r1') || selectedModel.name.includes('Düşünen')) && (
              <TypingAnimation />
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Floating "Yeni mesajlar ↓" / Scroll to Bottom Indicator */}
        <AnimatePresence>
          {showScrollBottomButton && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
            >
              <button
                onClick={() => scrollToBottom('smooth')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-2xl transition-all border backdrop-blur-md cursor-pointer active:scale-95 ${
                  hasNewUnreadMessages 
                    ? 'bg-blue-600 text-white border-blue-400/40 shadow-blue-600/30 ring-2 ring-blue-500/20' 
                    : 'bg-[#141416]/90 hover:bg-[#1f1f23] text-zinc-300 hover:text-white border-white/10 shadow-black/60'
                }`}
                title="Aşağı kaydır"
              >
                <span>{hasNewUnreadMessages ? 'Yeni mesajlar' : 'Aşağı kaydır'}</span>
                <ArrowDown className={`w-3.5 h-3.5 ${hasNewUnreadMessages ? 'animate-bounce text-white' : 'text-zinc-400'}`} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar: Interactive input if logged in, sleek CTA if logged out */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-10 pb-4 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            {user && user.emailVerified && !profile?.isBanned ? (
              <InputArea 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
                thinkingCooldownUntil={thinkingCooldownUntil}
                isGo={isGo}
                onOpenGoModal={() => setIsGoModalOpen(true)}
                onOpenModelSheet={() => setIsModelSheetOpen(true)}
                onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
                onAttachClick={() => {
                  if (!isGo) {
                    setCooldownToast({
                      message: "🚀 Dosya yükleme WnelAI Go özelliğidir. VIP veya Go üyesi olarak dosya yükleyebilirsiniz.",
                      visible: true
                    });
                    setIsGoModalOpen(true);
                  }
                }}
              />
            ) : !user ? (
              <div className="bg-[#141416]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Sohbete başlamak için hazır mısınız?</div>
                    <div className="text-xs text-zinc-400">Ücretsiz giriş yapın veya hemen yeni hesap oluşturun.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer text-center"
                  >
                    Giriş yap
                  </button>
                  <button
                    onClick={() => handleOpenAuth('register')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer text-center"
                  >
                    Kayıt ol
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialTab={profileInitialTab}
        onOpenGoModal={() => setIsGoModalOpen(true)}
      />

      {/* WnelAI Go Modal */}
      <WnelGoModal
        isOpen={isGoModalOpen}
        onClose={() => setIsGoModalOpen(false)}
        onClaimVipPrompt={() => {
          setIsGoModalOpen(false);
          handleSendMessage('/claimvip');
        }}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={handleCloseAdmin}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      {/* Model Selector Sheet (Screenshot 3 style) */}
      <ModelSelectorSheet
        isOpen={isModelSheetOpen}
        onClose={() => setIsModelSheetOpen(false)}
        selectedModel={selectedModel}
        onModelSelect={handleModelSelect}
        thinkingCooldownUntil={thinkingCooldownUntil}
        onThinkingLockedClick={() => showThinkingLockedAlert()}
      />

      {/* Interactive Voice Mode Modal */}
      {isVoiceModeOpen && (
        <VoiceModeModal
          isOpen={isVoiceModeOpen}
          onClose={() => setIsVoiceModeOpen(false)}
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          onOpenGoModal={() => setIsGoModalOpen(true)}
        />
      )}

      {/* Temporary Test Access Gate */}
      <AnimatePresence>
        {!hasTestAccess && (
          <TestAccessGate onSuccess={() => setHasTestAccess(true)} />
        )}
      </AnimatePresence>

      {/* Floating Cooldown Notification Toast */}
      <AnimatePresence>
        {cooldownToast && cooldownToast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto"
          >
            <div className="bg-[#18181b]/95 border border-amber-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-amber-950/40 backdrop-blur-xl flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 leading-snug">
                  {cooldownToast.message}
                </div>
              </div>
              <button 
                onClick={() => setCooldownToast(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
