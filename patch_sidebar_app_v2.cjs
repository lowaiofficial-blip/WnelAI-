const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSidebar = `<Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
      />`;

const newSidebar = `<Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
      />`;

const idx = content.indexOf('<Sidebar ');
if (idx !== -1) {
  const endIdx = content.indexOf('/>', idx) + 2;
  const toReplace = content.substring(idx, endIdx);
  content = content.replace(toReplace, newSidebar);
  fs.writeFileSync('src/App.tsx', content);
  console.log('App Sidebar patched successfully V2');
} else {
  console.log('Sidebar not found');
}
