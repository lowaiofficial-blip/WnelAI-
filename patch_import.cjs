const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = `import { createChat, addMessageToChat, getChatMessages } from './lib/firebase/firestore';`;
const replacementImport = `import { createChat, addMessageToChat, getChatMessages, updateChatTitle } from './lib/firebase/firestore';`;

const targetDynamic = `const { updateChatTitle } = await import('./lib/firebase/firestore');`;
const replacementDynamic = ``;

content = content.replace(targetImport, replacementImport);
content = content.replace(targetDynamic, replacementDynamic);

fs.writeFileSync('src/App.tsx', content);
