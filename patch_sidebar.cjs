const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const target = `  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
    }
  }, [user, currentChatId]);`;

const replacement = `  useEffect(() => {
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
  }, [user]);`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
console.log('Patched Sidebar.tsx');
