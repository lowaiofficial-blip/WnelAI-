const fs = require('fs');
let content = fs.readFileSync('src/components/chat/InputArea.tsx', 'utf8');

const target = `    <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2">`;
const replacement = `    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 pb-4 md:pb-6 pt-2">`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/chat/InputArea.tsx', content);
console.log('Patched InputArea.tsx');
