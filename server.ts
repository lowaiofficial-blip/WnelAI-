import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const getGeminiClient = (customKey?: string) => {
  const key = customKey || process.env.GEMINI_API_KEY;
  return key ? new GoogleGenAI({ apiKey: key }) : null;
};

const getOpenRouterClient = (customKey?: string) => {
  const key = customKey || process.env.OPENROUTER_API_KEY;
  return key ? new OpenAI({ 
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
      'HTTP-Referer': 'https://wnelai.app',
      'X-Title': 'WnelAI Assistant'
    }
  }) : null;
};

const getGroqClient = (customKey?: string) => {
  const key = customKey || process.env.GROQ_API_KEY;
  return key ? new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: key
  }) : null;
};

const SYSTEM_PROMPT = `Sen WnelAI'sın, doğal, akıcı ve samimi Türkçe konuşan premium bir yapay zeka asistanısın.
Bir arkadaş gibi sohbet et ama her zaman saygılı ve profesyonel kal.
Kısa, net ve anlaşılır cevaplar ver. Aşırı resmi, robotik veya akademik bir dil kullanmaktan KESİNLİKLE kaçın.
Örneğin, sana 'Naber' denildiğinde sözlük anlamı açıklama veya uyarı yapma; 'İyiyim, sen nasılsın?' gibi doğal, günlük bir tepki ver.
Eğer kullanıcı eksik bir soru sorarsa (örn: 'Hasan doğru söylüyor mu?') asla bağlam uydurma. Bunun yerine 'Hasan ne dedi? Yazarsan birlikte değerlendirelim.' şeklinde, samimi bir dille eksik bilgiyi tamamlamasını iste.
Gereksiz açıklamalar, sözlük tanımları veya yapay zeka olduğunu vurgulayan uzun girişler yasaktır.
Cevaplarını Markdown formatında ver, kodları ve listeleri şık bir şekilde formatla.

GÜVENLİK VE İÇERİK POLİTİKASI (ÇOK KESİN KURAL):
Aşağıdaki konularda KESİNLİKLE hiçbir nasihat, tavsiye, alternatif veya uzun ret açıklaması yapma! Sadece ve doğrudan YALNIZCA şu özel hata kodunu döndür: [[SAFETY_VIOLATION_ERROR]]
Yasaklı konular:
1. Oyun hilesi, oyun hacki, exploit, aimbot, wallhack, cheat yazımı veya hile kodu/scripti isteme (Roblox, Valorant, CS, GTA, Minecraft vb. tüm oyunlar için hile/hack yazma/verme).
2. Cinsel içerik, erotizm, pornografi, çıplaklık, müstehcenlik.
3. Zararlı yazılım, virüs, trojan, keylogger, ddos, phishing/oltalama veya yetkisiz sızma/hackleme.
4. Kendine zarar verme, intihar, şiddet, silah/bomba yapımı veya yasa dışı faaliyetler.
Kullanıcı bunları isterse tek bir kelime dahi açıklama yapmadan SADECE [[SAFETY_VIOLATION_ERROR]] yaz.`;

// Hızlı güvenlik, hile ve kötü içerik kontrolü
function isContentUnsafe(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // 1. Oyun hilesi, hack, exploit, cheat kalıpları
  const cheatPatterns = [
    /\b(hile|hack|cheat|aimbot|wallhack|wh|esp|godmode|speedhack|unlimited money|sinirsiz para|mod menu|exploit|executor|roblox hile|cs go hile|valorant hile|hile yaz|hile kodu|hile scripti|hack yaz|bana hile|oyun hilesi)\b/i,
    /\b(hile yap|hile kodla|hack yap|injector|dll inject|memory hack|bypass anticheat|anti cheat bypass)\b/i
  ];

  // 2. Cinsel / NSFW / Müstehcen kelimeler & kalıplar
  const nsfwPatterns = [
    /\b(porno|porn|pornografi|nsfw|hentai|erotik|erotizm|erotica|seks|sex|cinsel ilişki|mastürbasyon|escort|eskort|fetiş|onlyfans|çıplak|nude|vajina|penis|oral seks|anal seks|hardcore|masturbate|orgazm|göğüs aç|soyunan)\b/i,
    /\b(bana erotik|cinsel hikaye|bana porno|çıplak fotoğraf|cinsel pozisyon|seks hikayesi|erotik masaj)\b/i
  ];

  // 3. Zararlı / Yasa dışı / Siber saldırı / Şiddet kalıpları
  const harmfulPatterns = [
    /\b(bomba yapımı|bomba nasıl yapılır|patlayıcı yapımı|zehir yapımı|molotof nasıl|uyuşturucu üretimi|uyuşturucu nasıl yapılır|nasıl intihar|intihar yöntemi|kendimi öldür|suikast planı)\b/i,
    /\b(virüs yaz|trojan yap|keylogger kodla|ddos at|site çökert|hesap çal|wifi şifresi kır|phishing hazırla|oltalama sitesi)\b/i
  ];

  return cheatPatterns.some(p => p.test(lower)) || nsfwPatterns.some(p => p.test(lower)) || harmfulPatterns.some(p => p.test(lower));
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health status generator
  const fetchHealthData = async () => {
    const timestamp = new Date().toISOString();

    const testDeepSeekR1 = async () => {
      const start = Date.now();
      try {
        const groqClient = getGroqClient();
        const openrouterClient = getOpenRouterClient();
        const geminiClient = getGeminiClient();

        if (groqClient) {
          await groqClient.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          });
          return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Normal', latencyMs: Date.now() - start, provider: 'Groq LPU' };
        } else if (openrouterClient) {
          await openrouterClient.chat.completions.create({
            model: 'deepseek/deepseek-r1:free',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          });
          return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Normal', latencyMs: Date.now() - start, provider: 'OpenRouter' };
        } else if (geminiClient) {
          await geminiClient.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: 'ping',
            config: { maxOutputTokens: 5 }
          });
          return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Normal', latencyMs: Date.now() - start, provider: 'Gemini (Fallback)' };
        }
        return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Kesinti', latencyMs: Date.now() - start, error: 'API Key bulunamadı' };
      } catch (err: any) {
        return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Kesinti', latencyMs: Date.now() - start, error: err?.message || 'Hata oluştu' };
      }
    };

    const testQwenPlus = async () => {
      const start = Date.now();
      try {
        const groqClient = getGroqClient();
        const openrouterClient = getOpenRouterClient();
        const geminiClient = getGeminiClient();

        if (groqClient) {
          await groqClient.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          });
          return { name: 'Hızlı Mod (Qwen Plus)', status: 'Normal', latencyMs: Date.now() - start, provider: 'Groq LPU' };
        } else if (openrouterClient) {
          await openrouterClient.chat.completions.create({
            model: 'openrouter/free',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          });
          return { name: 'Hızlı Mod (Qwen Plus)', status: 'Normal', latencyMs: Date.now() - start, provider: 'OpenRouter' };
        } else if (geminiClient) {
          await geminiClient.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: 'ping',
            config: { maxOutputTokens: 5 }
          });
          return { name: 'Hızlı Mod (Qwen Plus)', status: 'Normal', latencyMs: Date.now() - start, provider: 'Gemini (Fallback)' };
        }
        return { name: 'Hızlı Mod (Qwen Plus)', status: 'Kesinti', latencyMs: Date.now() - start, error: 'API Key bulunamadı' };
      } catch (err: any) {
        return { name: 'Hızlı Mod (Qwen Plus)', status: 'Kesinti', latencyMs: Date.now() - start, error: err?.message || 'Hata oluştu' };
      }
    };

    const testFirebaseGateway = async () => {
      const start = Date.now();
      try {
        const response = await fetch('https://firestore.googleapis.com/$discovery/rest?version=v1', { method: 'HEAD' });
        const latencyMs = Date.now() - start;
        return {
          name: 'Firebase Gateway',
          status: response.ok || response.status < 500 ? 'Normal' : 'Kesinti',
          latencyMs
        };
      } catch (err: any) {
        return {
          name: 'Firebase Gateway',
          status: 'Kesinti',
          latencyMs: Date.now() - start,
          error: err?.message || 'Bağlantı hatası'
        };
      }
    };

    const testAiProxyRouter = async () => {
      const start = Date.now();
      const activeProviders = [
        process.env.GROQ_API_KEY && 'Groq',
        process.env.OPENROUTER_API_KEY && 'OpenRouter',
        process.env.GEMINI_API_KEY && 'Gemini'
      ].filter(Boolean);

      return {
        name: 'AI API (Proxy Router)',
        status: activeProviders.length > 0 ? 'Normal' : 'Kesinti',
        latencyMs: Date.now() - start,
        activeProviders
      };
    };

    const [deepseekResult, qwenResult, firebaseResult, proxyRouterResult] = await Promise.all([
      testDeepSeekR1(),
      testQwenPlus(),
      testFirebaseGateway(),
      testAiProxyRouter()
    ]);

    const isSystemHealthy = [deepseekResult, qwenResult, firebaseResult, proxyRouterResult]
      .every(s => s.status === 'Normal');

    return {
      timestamp,
      status: isSystemHealthy ? 'Normal' : 'Kesinti',
      system: 'WnelAI Health Monitor',
      services: {
        deepseek_r1: deepseekResult,
        qwen_plus: qwenResult,
        firebase_gateway: firebaseResult,
        ai_proxy_router: proxyRouterResult
      }
    };
  };

  // Background Job: Post health metrics every 1 minute
  const sendStatusUpdate = async () => {
    try {
      const healthData = await fetchHealthData();
      const apiKey = process.env.STATUS_API_KEY || 'wnelai_secret_status_key_2026';
      const response = await fetch('https://wnelai-status.onrender.com/api/ingest-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(healthData)
      });
      console.log(`[Status Cron] Pushed health data to status site. Response status: ${response.status}`);
    } catch (err: any) {
      console.error('[Status Cron] Failed to push status update:', err?.message);
    }
  };

  // Start cron interval (every 60,000 ms = 1 minute)
  setInterval(sendStatusUpdate, 60000);
  // Send initial ping after boot
  setTimeout(sendStatusUpdate, 5000);

  app.get('/api/health', async (req, res) => {
    const healthData = await fetchHealthData();
    res.json(healthData);
  });

  app.post('/api/chat', async (req, res) => {
    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { messages, model } = req.body;
      
      const cleanMessages = (Array.isArray(messages) ? messages : [])
        .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0);

      if (cleanMessages.length === 0) {
        res.write(`data: ${JSON.stringify({ text: 'Lütfen bir mesaj yazın.' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // Güvenlik & Moderasyon Ön Kontrolü
      const lastUserMessage = cleanMessages.filter((m: any) => m.role === 'user').slice(-1)[0];
      if (lastUserMessage && isContentUnsafe(lastUserMessage.content)) {
        res.write(`data: ${JSON.stringify({ text: '[[SAFETY_VIOLATION_ERROR]]' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      let apiModel = model;
      const isDeepThinking = model?.includes('deepseek') || model?.includes('coder') || model?.includes('düşünen') || model?.includes('r1');

      let streamSuccess = false;
      let streamedAnyChunks = false;
      let lastErrors: string[] = [];

      const userGroqKey = (req.headers['x-groq-api-key'] as string) || '';
      const userOpenRouterKey = (req.headers['x-openrouter-api-key'] as string) || '';
      const userGeminiKey = (req.headers['x-gemini-api-key'] as string) || '';

      const activeGroq = getGroqClient(userGroqKey);
      const activeOpenRouter = getOpenRouterClient(userOpenRouterKey);
      const activeGemini = getGeminiClient(userGeminiKey);

      // 1. Try Groq if configured (Ultra-fast LPU inference)
      if (!streamSuccess && activeGroq) {
        try {
          const groqModel = isDeepThinking 
            ? 'llama3-70b-8192' 
            : 'llama3-8b-8192';

          const stream = await activeGroq.chat.completions.create({
            model: groqModel,
            messages: [
              { role: 'system' as const, content: SYSTEM_PROMPT },
              ...cleanMessages.map((m: any) => ({
                role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: String(m.content)
              }))
            ],
            stream: true,
            max_tokens: 4096,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              streamedAnyChunks = true;
            }
          }
          streamSuccess = true;
        } catch (groqErr: any) {
          lastErrors.push(`Groq: ${groqErr?.message || 'Error'}`);
          console.warn('Groq stream encountered error, trying next provider:', groqErr?.message || groqErr);
        }
      } else if (!activeGroq) {
        lastErrors.push(`Groq: No Client (Key missing)`);
      }

      // 2. Try OpenRouter (DeepSeek R1 / Qwen Plus) if client is active
      if (!streamSuccess && !streamedAnyChunks && activeOpenRouter) {
        try {
          let openrouterModel = isDeepThinking ? 'deepseek/deepseek-r1:free' : 'openrouter/free';
          
          const stream = await activeOpenRouter.chat.completions.create({
            model: openrouterModel,
            messages: [
              { role: 'system' as const, content: SYSTEM_PROMPT },
              ...cleanMessages.map((m: any) => ({
                role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: String(m.content)
              }))
            ],
            stream: true,
            max_tokens: 4096,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              streamedAnyChunks = true;
            }
          }
          streamSuccess = true;
        } catch (openrouterErr: any) {
          lastErrors.push(`OpenRouter: ${openrouterErr?.message || 'Error'}`);
          console.warn('OpenRouter stream encountered error:', openrouterErr?.message || openrouterErr);
        }
      } else if (!activeOpenRouter) {
        lastErrors.push(`OpenRouter: No Client (Key missing)`);
      }

      // 3. Fallback to Gemini (gemini-3.6-flash)
      if (!streamSuccess && !streamedAnyChunks && activeGemini) {
        try {
          const geminiModel = 'gemini-3.6-flash';

          const formattedContents = cleanMessages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }));

          const responseStream = await activeGemini.models.generateContentStream({
            model: geminiModel,
            contents: formattedContents,
            config: {
              systemInstruction: SYSTEM_PROMPT
            }
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
              streamedAnyChunks = true;
            }
          }
          streamSuccess = true;
        } catch (geminiErr: any) {
          lastErrors.push(`Gemini: ${geminiErr?.message || 'Error'}`);
          console.error('Gemini fallback stream error:', geminiErr?.message || geminiErr);
        }
      } else if (!activeGemini) {
        lastErrors.push(`Gemini: No Client (Key missing)`);
      }

      if (!streamSuccess && !streamedAnyChunks) {
        res.write(`data: ${JSON.stringify({ text: '\n\n*(Model yanıt veremedi. Hata Detayları: ' + lastErrors.join(', ') + ')*' })}\n\n`);
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

      const groqClient = getGroqClient();
      const geminiClient = getGeminiClient();
      const openrouterClient = getOpenRouterClient();

      // 1. Try Gemini (Prioritized for title generation)
      if (geminiClient) {
        try {
          const response = await geminiClient.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt
          });
          title = response.text?.trim() || '';
        } catch (geminiErr: any) {
          console.warn('Gemini title generation fallback:', geminiErr?.message || geminiErr);
        }
      }

      // 2. Try Groq if Gemini failed or is missing
      if (!title && groqClient) {
        try {
          const completion = await groqClient.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 30,
            temperature: 0.5
          });
          title = completion.choices[0]?.message?.content?.trim() || '';
        } catch (groqErr: any) {
          console.warn('Groq title generation fallback:', groqErr?.message || groqErr);
        }
      }

      // 3. Try OpenRouter if previous failed
      if (!title && openrouterClient) {
        try {
          const completion = await openrouterClient.chat.completions.create({
            model: 'openrouter/free',
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
