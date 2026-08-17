const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const target1 = `  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0
        }}
        className={cn(
          "fixed md:relative z-50 h-full bg-[#0a0a0a] border-r border-white/5 overflow-hidden shrink-0",
          !isOpen && "md:w-0 md:border-r-0"
        )}
      >`;

const replacement1 = `  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0
        }}
        className={cn(
          "fixed lg:relative z-50 h-full bg-[#0a0a0a] border-r border-white/5 overflow-hidden shrink-0",
          !isOpen && "lg:w-0 lg:border-r-0"
        )}
      >`;

const target2 = `              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors md:hidden"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors hidden md:block"
                title="Kenar Çubuğunu Kapat"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>`;

const replacement2 = `              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors lg:hidden"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors hidden lg:block"
                title="Kenar Çubuğunu Kapat"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>`;
              
content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync('src/components/layout/Sidebar.tsx', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const appTarget = `  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans antialiased selection:bg-blue-500/30">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        currentChatId={activeChatId}
        onSelectChat={(id) => setCurrentChatId(id)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <Header 
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
        />`;

const appReplacement = `  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans antialiased selection:bg-blue-500/30">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        currentChatId={activeChatId}
        onSelectChat={(id) => setCurrentChatId(id)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <Header 
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
        />`;
        
appContent = appContent.replace(appTarget, appReplacement);
fs.writeFileSync('src/App.tsx', appContent);

let headerContent = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

const headerTarget1 = `          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors md:hidden"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>`;
          
const headerReplacement1 = `          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors lg:hidden"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>`;

const headerTarget2 = `        <div className="flex items-center gap-2">
          <button onClick={onNewChat} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors hidden md:block" title="Yeni Sohbet">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 hidden md:block">{user.email}</span>
              <button onClick={signOut} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors" title="Çıkış yap">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => openAuth('login')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-full transition-colors hidden md:block text-sm">
              Giriş yap
            </button>
          )}
          
          <button onClick={onNewChat} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors md:hidden" title="Yeni Sohbet">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>`;

const headerReplacement2 = `        <div className="flex items-center gap-2">
          <button onClick={onNewChat} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors hidden lg:block" title="Yeni Sohbet">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 hidden lg:block">{user.email}</span>
              <button onClick={signOut} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors" title="Çıkış yap">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => openAuth('login')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-full transition-colors hidden lg:block text-sm">
              Giriş yap
            </button>
          )}
          
          <button onClick={onNewChat} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors lg:hidden" title="Yeni Sohbet">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>`;

headerContent = headerContent.replace(headerTarget1, headerReplacement1);
headerContent = headerContent.replace(headerTarget2, headerReplacement2);
fs.writeFileSync('src/components/layout/Header.tsx', headerContent);

