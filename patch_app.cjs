const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      if (user) {
        if (!activeChatId) {
          activeChatId = await createChat(user.uid, content.substring(0, 30) + '...');
          setCurrentChatId(activeChatId);
        }`;

const replacement = `      let isNewChat = false;
      if (user) {
        if (!activeChatId) {
          isNewChat = true;
          activeChatId = await createChat(user.uid, "Yeni Sohbet");
          setCurrentChatId(activeChatId);
        }`;

const target2 = `      if (user && activeChatId) {
        await addMessageToChat(activeChatId, 'ai', fullResponse);
      }`;

const replacement2 = `      if (user && activeChatId) {
        await addMessageToChat(activeChatId, 'ai', fullResponse);
        
        // Generate title if new chat
        if (isNewChat) {
          fetch('/api/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages.concat({ role: 'ai', content: fullResponse }) })
          })
          .then(res => res.json())
          .then(async (data) => {
            if (data.title) {
              const { updateChatTitle } = await import('./lib/firebase/firestore');
              await updateChatTitle(activeChatId, data.title);
              window.dispatchEvent(new CustomEvent('chat-updated'));
            }
          })
          .catch(err => console.error("Title generation error", err));
        }
      }`;

content = content.replace(target, replacement);
content = content.replace(target2, replacement2);
fs.writeFileSync('src/App.tsx', content);
console.log('Patched App.tsx');
