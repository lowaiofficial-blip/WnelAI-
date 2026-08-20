import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openrouterKey = process.env.OPENROUTER_API_KEY;
const openrouter = openrouterKey ? new OpenAI({ 
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: openrouterKey 
}) : null;

const SYSTEM_PROMPT = `Sen WnelAI'sın, doğal, akıcı ve samimi Türkçe konuşan premium bir yapay zeka asistanısın.
Bir arkadaş gibi sohbet et ama her zaman saygılı ve profesyonel kal.
Kısa, net ve anlaşılır cevaplar ver. Aşırı resmi, robotik veya akademik bir dil kullanmaktan KESİNLİKLE kaçın.
Örneğin, sana 'Naber' denildiğinde sözlük anlamı açıklama veya uyarı yapma; 'İyiyim, sen nasılsın?' gibi doğal, günlük bir tepki ver.
Eğer kullanıcı eksik bir soru sorarsa (örn: 'Hasan doğru söylüyor mu?') asla bağlam uydurma. Bunun yerine 'Hasan ne dedi? Yazarsan birlikte değerlendirelim.' şeklinde, samimi bir dille eksik bilgiyi tamamlamasını iste.
Gereksiz açıklamalar, sözlük tanımları veya yapay zeka olduğunu vurgulayan uzun girişler yasaktır.
Cevaplarını Markdown formatında ver, kodları ve listeleri şık bir şekilde formatla.`;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/chat', async (req, res) => {
    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { messages, model } = req.body;
      
      let apiModel = model;
      if (model === 'qwen/qwen-turbo') {
        apiModel = 'qwen/qwen-plus';
      } else if (model === 'qwen/qwen-coder-32b-instruct' || model === 'qwen/qwen2.5-coder-32b-instruct') {
        apiModel = 'qwen/qwen-2.5-coder-32b-instruct';
      }

      let streamSuccess = false;

      // 1. Try OpenRouter if requested and available
      if (apiModel?.startsWith('qwen') && openrouter) {
        try {
          const stream = await openrouter.chat.completions.create({
            model: apiModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
              }))
            ],
            stream: true,
            max_tokens: 4096,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          }
          streamSuccess = true;
        } catch (openrouterErr: any) {
          console.warn('OpenRouter stream encountered error, attempting Gemini fallback:', openrouterErr?.message || openrouterErr);
        }
      }

      // 2. Fallback to Gemini if OpenRouter was not used or failed
      if (!streamSuccess && process.env.GEMINI_API_KEY) {
        try {
          const isDeepThinking = model?.includes('coder') || model?.includes('düşünen') || model?.includes('2.5-coder');
          const geminiModel = isDeepThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

          const formattedContents = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));

          const responseStream = await ai.models.generateContentStream({
            model: geminiModel,
            contents: formattedContents,
            config: {
              systemInstruction: SYSTEM_PROMPT
            }
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
          }
          streamSuccess = true;
        } catch (geminiErr: any) {
          console.error('Gemini fallback stream error:', geminiErr?.message || geminiErr);
          
          // Try standard flash as last resort if pro failed
          try {
            const responseStream = await ai.models.generateContentStream({
              model: 'gemini-2.5-flash',
              contents: messages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
              })),
              config: { systemInstruction: SYSTEM_PROMPT }
            });

            for await (const chunk of responseStream) {
              if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
              }
            }
            streamSuccess = true;
          } catch (lastResortErr: any) {
            console.error('All AI models failed:', lastResortErr?.message || lastResortErr);
          }
        }
      }

      if (!streamSuccess) {
        res.write(`data: ${JSON.stringify({ text: '\n\n*(Model şu anda yoğun veya bağlantı koptu. Lütfen sorunuzu tekrar gönderin.)*' })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      console.error('Chat API Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'An error occurred' });
      } else {
        res.write(`data: ${JSON.stringify({ text: '\n\n*(Bağlantı kesildi. Lütfen tekrar deneyin.)*' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  });

  // Temporary Test Access Code Verification
  app.post('/api/verify-test-access', (req, res) => {
    try {
      const { code } = req.body;
      const validCode = process.env.TEST_ACCESS_CODE || '9317';
      if (typeof code === 'string' && code.trim() === validCode) {
        return res.json({ success: true, message: 'Test erişimi onaylandı.' });
      }
      return res.status(401).json({ success: false, error: 'Erişim kodu hatalı.' });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Doğrulama sırasında sunucu hatası oluştu.' });
    }
  });

  app.post('/api/generate-title', async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || messages.length === 0) {
        return res.status(400).json({ title: "Yeni Sohbet" });
      }

      const prompt = `GÖREV: Aşağıdaki sohbetin ANA KONUSUNU anlatan, 2 ila 4 kelimelik, net, profesyonel ve etkileyici bir Türkçe başlık yaz.
KURALLAR:
1. Asla "Merhaba", "Selam", "Sohbet", "Konuşma", "Soru" gibi genel veya boş kelimelerle başlama.
2. Konunun özünü yakala (Örnekler: "Python Döngüleri", "E-Ticaret Fikirleri", "Kariyer Tavsiyeleri", "İstanbul Gezi Rehberi").
3. Sadece başlığı döndür. Tırnak, parantez veya açıklama yazma.

Sohbet:
${messages.slice(0, 4).map((m: any) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`).join('\n')}
`;

      let title = '';

      // 1. Try Gemini first (if key exists)
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
          title = response.text?.trim() || '';
        } catch (geminiErr: any) {
          console.warn('Gemini title generation fallback:', geminiErr?.message || geminiErr);
        }
      }

      // 2. Try OpenRouter if Gemini failed or no Gemini key
      if (!title && openrouter) {
        try {
          const completion = await openrouter.chat.completions.create({
            model: 'qwen/qwen-plus',
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 30,
            temperature: 0.5
          });
          title = completion.choices[0]?.message?.content?.trim() || '';
        } catch (openrouterErr: any) {
          console.warn('OpenRouter title generation fallback:', openrouterErr?.message || openrouterErr);
        }
      }

      // 3. Smart Local Extraction Fallback (if no API keys or all failed)
      if (!title) {
        const firstUserMsg = (messages.find((m: any) => m.role === 'user')?.content || '')
          .replace(/^(merhaba|selam|selamlar|hey|naber|günaydın|iyi günler|hocam|wnelai|bot)[,!.\s]*/gi, '')
          .trim();

        if (firstUserMsg.length > 3) {
          const words = firstUserMsg.split(/\s+/).slice(0, 5).join(' ');
          title = words.charAt(0).toUpperCase() + words.slice(1);
          if (title.length > 32) title = title.slice(0, 32) + '...';
        } else {
          title = "Yeni Sohbet";
        }
      }

      // Clean up punctuation and quotes
      title = title.replace(/^["'«“]|["'»”]$/g, '').replace(/[.!?]+$/, '').trim();
      if (title.length > 40) title = title.slice(0, 40);

      res.json({ title: title || "Yeni Sohbet" });
    } catch (error) {
      console.error('Title generation error:', error);
      res.json({ title: "Yeni Sohbet" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
