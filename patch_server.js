const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `const geminiModel = 'gemini-3.1-pro-preview';`;
const replacement = `const geminiModel = 'gemini-2.5-flash';`;

content = content.replace(target, replacement);
content = content.replace(target, replacement);

fs.writeFileSync('server.ts', content);
