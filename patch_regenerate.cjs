const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The role in types is 'ai' not 'assistant'
content = content.replace(/aiMessage\.role !== 'assistant'/g, "aiMessage.role !== 'ai'");
content = content.replace(/role: 'assistant'/g, "role: 'ai'");
content = content.replace(/message\.role === "assistant"/g, 'message.role === "ai"');
content = content.replace(/message\.role === 'assistant'/g, "message.role === 'ai'");

fs.writeFileSync('src/App.tsx', content);
console.log('Regenerate patched successfully');
