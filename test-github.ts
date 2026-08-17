import OpenAI from 'openai';
const client = new OpenAI({ baseURL: 'https://models.inference.ai.azure.com', apiKey: 'test' });
client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'hello' }]
}).catch(console.error);
