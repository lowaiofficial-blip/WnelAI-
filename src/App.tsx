import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MessageBubble } from './components/chat/MessageBubble';
import { InputArea } from './components/chat/InputArea';
import { ThinkingAnimation } from './components/chat/ThinkingAnimation';
import { TypingAnimation } from './components/chat/TypingAnimation';
import { Message, Model, AVAILABLE_MODELS } from './types';
import { Loader2, Ban, LogIn, UserPlus, Sparkles, Mail } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { createChat, addMessageToChat, getChatMessages, updateChatTitle } from './lib/firebase/firestore';
import { WnelLogo } from './components/common/WnelLogo';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { AdminPanelModal } from './components/admin/AdminPanelModal';
import { AuthModal } from './components/auth/AuthModal';

export default function App() {
  const { user, profile, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(AVAILABLE_MODELS[0]);
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
  };

  const handleSelectChat = async (chatId: string) => {
    if (currentChatId === chatId) return;
    setCurrentChatId(chatId);
    setIsChatLoading(true);
    try {
      const dbMessages = await getChatMessages(chatId);
      setMessages(dbMessages.map(m => ({
        id: m.id || Date.now().toString(),
        role: m.role,
        content: m.content
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (profile?.isBanned) {
      return;
    }

    let activeChatId = currentChatId;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

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
      const isThinkingMode = selectedModel.id.includes('coder');
      
      let fullResponse = '';
      let isTimerDone = !isThinkingMode;
      let streamQueue = '';
      let isStreamFinished = false;
      let displayedContent = '';
      let hasAddedMessage = false;

      // Start the thinking timer (7.2 seconds for 4 steps)
      const thinkingTimer = isThinkingMode 
        ? new Promise<void>(resolve => setTimeout(() => {
            isTimerDone = true;
            resolve();
          }, 7200)) 
        : Promise.resolve();

      const renderLoop = async () => {
        while (!isStreamFinished || streamQueue.length > 0) {
          if (isTimerDone && streamQueue.length > 0) {
            if (!hasAddedMessage) {
              hasAddedMessage = true;
              setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isStreaming: true }]);
            }
            // Dynamic pacing based on queue size to catch up smoothly but naturally
            const charsToTake = streamQueue.length > 100 ? 8 : (streamQueue.length > 30 ? 4 : 2);
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
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: 'Bir hata oluştu. Lütfen tekrar deneyin.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans antialiased selection:bg-blue-500/30">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        <Header 
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          onOpenProfile={handleOpenProfile}
          onOpenAdmin={handleOpenAdmin}
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

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pt-4 pb-32">
          <div className="max-w-4xl mx-auto px-4 w-full flex flex-col gap-6">
            {!user ? (
              <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 py-8 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <WnelLogo size="xl" withGlow={true} />
                  <div className="text-center max-w-lg">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight mb-2">
                      WnelAI'ye Hoş Geldiniz
                    </h1>
                    <h2 className="text-base sm:text-lg md:text-xl font-medium text-blue-400 tracking-tight leading-snug">
                      Sohbete başlamak için giriş yapın veya kayıt olun.
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                      WnelAI ile kod yazın, analiz yapın, fikir üretin ve sınırsız yapay zeka deneyiminin tadını çıkarın.
                    </p>
                  </div>
                </div>

                {/* Central responsive action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-sm">
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium py-3 px-5 rounded-2xl shadow-lg shadow-blue-600/25 transition-all text-sm cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Giriş Yap</span>
                  </button>
                  <button
                    onClick={() => handleOpenAuth('register')}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-zinc-200 font-medium py-3 px-5 rounded-2xl transition-all text-sm cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Kayıt Ol</span>
                  </button>
                </div>
              </div>
            ) : user && !user.emailVerified ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                <div className="bg-[#141416] border border-blue-500/30 rounded-3xl p-8 text-center max-w-md shadow-2xl">
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
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[65vh] opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <WnelLogo size="xl" withGlow={true} />
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-semibold text-blue-500 tracking-tight leading-snug">Hadi başlayalım.</h1>
                    <h2 className="text-2xl md:text-3xl font-semibold text-blue-500/80 tracking-tight leading-snug">WnelAI'ye Sor, Daha Fazlasını Öğren.</h2>
                  </div>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && selectedModel.id.includes('coder') && (
              <ThinkingAnimation />
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && !selectedModel.id.includes('coder') && (
              <TypingAnimation />
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Bottom Bar: Interactive input if logged in, sleek CTA if logged out */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-10 pb-4 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            {user && user.emailVerified && !profile?.isBanned ? (
              <InputArea onSend={handleSendMessage} isLoading={isLoading} />
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
    </div>
  );
}
