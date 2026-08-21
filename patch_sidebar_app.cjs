const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Sidebar props
content = content.replace(
  /<Sidebar\s+isOpen={isSidebarOpen}\s+onClose={\(\) => setIsSidebarOpen\(false\)}\s+onNewChat={handleNewChat}\s+onSelectChat={handleSelectChat}\s+currentChatId={currentChatId}\s+onOpenProfile={handleOpenProfile}\s+onOpenAdmin={handleOpenAdmin}\s+onOpenAuth={handleOpenAuth}\s+\/>/g,
  `<Sidebar \n            isOpen={isSidebarOpen} \n            onClose={() => setIsSidebarOpen(false)} \n            onNewChat={handleNewChat} \n            onSelectChat={handleSelectChat} \n            currentChatId={currentChatId}\n            onOpenProfile={handleOpenProfile}\n            onOpenAdmin={handleOpenAdmin}\n            onOpenAuth={handleOpenAuth}\n            selectedModel={selectedModel}\n            onModelSelect={setSelectedModel}\n          />`
);

fs.writeFileSync('src/App.tsx', content);
console.log('App Sidebar patched successfully');
