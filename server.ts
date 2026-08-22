import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

// 4-Digit Email Verification Store (10 mins validity, max 5 attempts)
interface StoredVerification {
  userId: string;
  email: string;
  displayName: string;
  username: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  lastRequestedAt: number;
}

const verificationStore = new Map<string, StoredVerification>();

// Dispatch verification notification strictly to admin support address using Resend HTTP API
async function sendAdminVerificationEmail(params: {
  email: string;
  displayName: string;
  username: string;
  code: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'golabsdestek@outlook.com';
  const { email, displayName, username, code } = params;

  console.log(`\n======================================================`);
  console.log(`[WnelAI Verification Email Request]`);
  console.log(`Target Admin: ${adminEmail}`);
  console.log(`User: ${email} (${displayName || username})`);
  console.log(`4-Digit PIN: ${code}`);
  console.log(`Expires in: 10 minutes (Max 5 attempts)`);
  console.log(`======================================================\n`);

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);

      const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WnelAI Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #121216; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.07);">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 100px; margin-bottom: 14px;">
                <span style="color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">WnelAI Security</span>
              </div>
              <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">WnelAI Verification</h1>
              <p style="margin: 0; color: #a1a1aa; font-size: 14px; font-weight: 500;">WnelAI Yeni Doğrulama İsteği</p>
            </td>
          </tr>
          <!-- PIN Box Section -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center;">
              <p style="margin: 0 0 14px 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">4 Haneli Doğrulama Kodu</p>
              
              <div style="display: inline-block; padding: 18px 36px; background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%); border: 2px solid #3b82f6; border-radius: 20px; box-shadow: 0 0 25px rgba(59, 130, 246, 0.25);">
                <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #60a5fa; font-family: 'SF Mono', Monaco, Consolas, monospace;">${code}</span>
              </div>
              
              <p style="margin: 14px 0 0 0; color: #fbbf24; font-size: 12px; font-weight: 500;">
                ⏱️ Bu kod 10 dakika boyunca geçerlidir.
              </p>
            </td>
          </tr>
          <!-- User Details -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px;">Kullanıcı E-postası:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px;">Kullanıcı Adı:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${displayName || username || 'Kullanıcı'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px;">Doğrulama Kodu:</td>
                    <td style="padding: 6px 0; color: #60a5fa; font-size: 14px; font-weight: 700; text-align: right;">${code}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; font-size: 13px;">Güvenlik Kuralı:</td>
                    <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px; text-align: right;">Maksimum 5 Hatalı Deneme</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px 24px 32px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 4px 0; color: #71717a; font-size: 12px;">
                Bu e-posta yetkili admin destek adresine (<strong>${adminEmail}</strong>) iletilmiştir.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 11px;">
                © 2026 WnelAI Systems. Güvenli E-posta Doğrulama Hizmeti.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Resend default sender: onboarding@resend.dev (or custom sender if configured)
      const fromEmail = process.env.RESEND_FROM || 'WnelAI Verification <onboarding@resend.dev>';

      const data = await resend.emails.send({
        from: fromEmail,
        to: [adminEmail],
        subject: `WnelAI Verification: ${code} (${email})`,
        text: `WnelAI Yeni Doğrulama İsteği\n\nKullanıcı: ${email}\nAdı: ${displayName || username}\nKod: ${code}\nGeçerlilik: 10 dakika`,
        html: htmlContent,
      });

      console.log(`[Resend HTTP API] Verification email sent successfully to ${adminEmail}! Email ID:`, data.data?.id);
      return true;
    } catch (err: any) {
      console.error('[Resend HTTP API Error]:', err?.message || err);
    }
  } else {
    console.log('[Resend Notice] RESEND_API_KEY is not defined in environment variables. Code logged to console.');
  }

  return true;
}

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
            model: 'qwen/qwen3.6-27b',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          });
          return { name: 'Düşünen Mod (DeepSeek-R1)', status: 'Normal', latencyMs: Date.now() - start, provider: 'Groq LPU' };
        } else if (openrouterClient) {
          await openrouterClient.chat.completions.create({
            model: 'deepseek/deepseek-r1',
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
            model: 'openai/gpt-oss-20b',
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
      const apiKey = process.env.STATUS_API_KEY || 'benim_gizli_anahtarim_9988';
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

  app.get('/api/server-date', (req, res) => {
    const now = new Date();
    res.json({
      date: now.toISOString().slice(0, 10),
      timestamp: now.getTime(),
      timezone: 'UTC'
    });
  });

  // Stream chunk parser to filter out <think>...</think> blocks dynamically
  class ThinkFilter {
    private buffer = '';
    private inThinkBlock = false;

    process(chunk: string): string {
      this.buffer += chunk;
      let output = '';

      while (this.buffer.length > 0) {
        if (!this.inThinkBlock) {
          const thinkStart = this.buffer.indexOf('<think>');
          if (thinkStart !== -1) {
            output += this.buffer.substring(0, thinkStart);
            this.inThinkBlock = true;
            this.buffer = this.buffer.substring(thinkStart + 7);
            continue;
          }

          const possibleStart = this.buffer.lastIndexOf('<');
          if (possibleStart !== -1 && '<think>'.startsWith(this.buffer.substring(possibleStart))) {
            output += this.buffer.substring(0, possibleStart);
            this.buffer = this.buffer.substring(possibleStart);
            break; // wait for more chunks
          } else {
            output += this.buffer;
            this.buffer = '';
          }
        } else {
          const thinkEnd = this.buffer.indexOf('</think>');
          if (thinkEnd !== -1) {
            this.inThinkBlock = false;
            this.buffer = this.buffer.substring(thinkEnd + 8);
            // Clean up leading newlines after </think> block ends
            this.buffer = this.buffer.replace(/^\s*\n\n/, '').replace(/^\s*\n/, '');
            continue;
          }

          const possibleEnd = this.buffer.lastIndexOf('<');
          if (possibleEnd !== -1 && '</think>'.startsWith(this.buffer.substring(possibleEnd))) {
            this.buffer = this.buffer.substring(possibleEnd);
            break; // wait for more chunks
          } else {
            this.buffer = ''; // discard reasoning
            break;
          }
        }
      }
      return output;
    }
    
    flush(): string {
      if (!this.inThinkBlock && this.buffer.length > 0) {
        const out = this.buffer;
        this.buffer = '';
        return out;
      }
      return '';
    }
  }

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
            ? 'qwen/qwen3.6-27b' 
            : 'openai/gpt-oss-20b';

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

          const filter = new ThinkFilter();
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const filteredText = filter.process(content);
              if (filteredText) {
                res.write(`data: ${JSON.stringify({ text: filteredText })}\n\n`);
                streamedAnyChunks = true;
              }
            }
          }
          const finalOut = filter.flush();
          if (finalOut) {
            res.write(`data: ${JSON.stringify({ text: finalOut })}\n\n`);
            streamedAnyChunks = true;
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
          let openrouterModel = isDeepThinking ? 'deepseek/deepseek-r1' : 'openrouter/free';
          
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

          const filter = new ThinkFilter();
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const filteredText = filter.process(content);
              if (filteredText) {
                res.write(`data: ${JSON.stringify({ text: filteredText })}\n\n`);
                streamedAnyChunks = true;
              }
            }
          }
          const finalOut = filter.flush();
          if (finalOut) {
            res.write(`data: ${JSON.stringify({ text: finalOut })}\n\n`);
            streamedAnyChunks = true;
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

          const filter = new ThinkFilter();
          for await (const chunk of responseStream) {
            if (chunk.text) {
              const filteredText = filter.process(chunk.text);
              if (filteredText) {
                res.write(`data: ${JSON.stringify({ text: filteredText })}\n\n`);
                streamedAnyChunks = true;
              }
            }
          }
          const finalOut = filter.flush();
          if (finalOut) {
            res.write(`data: ${JSON.stringify({ text: finalOut })}\n\n`);
            streamedAnyChunks = true;
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
        if (isDeepThinking) {
          res.write(`data: ${JSON.stringify({ text: '⚠️ Düşünen Mod şu anda yoğunluk nedeniyle kullanılamıyor. Lütfen biraz sonra tekrar deneyin.' })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ text: '\n\n*(Model yanıt veremedi. Hata Detayları: ' + lastErrors.join(', ') + ')*' })}\n\n`);
        }
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

  // 4-Digit Email Verification System for Admin
  app.post('/api/send-verification-code', async (req, res) => {
    try {
      const { userId, email, displayName, username } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ success: false, error: 'Kullanıcı kimliği ve e-posta zorunludur.' });
      }

      const existing = verificationStore.get(userId);
      const now = Date.now();

      // Cooldown prevention (min 10 seconds between requests)
      if (existing && !existing.isUsed && (now - existing.lastRequestedAt < 10000)) {
        const waitSec = Math.ceil((10000 - (now - existing.lastRequestedAt)) / 1000);
        return res.status(429).json({ 
          success: false, 
          error: `Lütfen yeni kod istemeden önce ${waitSec} saniye bekleyin.` 
        });
      }

      // Generate random 4-digit code between 1000 and 9999
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = now + (10 * 60 * 1000); // 10 minutes validity

      const record: StoredVerification = {
        userId,
        email: email.trim().toLowerCase(),
        displayName: displayName || email.split('@')[0] || 'Kullanıcı',
        username: username || email.split('@')[0] || 'kullanici',
        code,
        createdAt: now,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        isUsed: false,
        status: 'pending',
        lastRequestedAt: now,
      };

      // Invalidate any previous code and store new one
      verificationStore.set(userId, record);

      // Asynchronously send HTML email strictly to admin support address (golabsdestek@outlook.com)
      sendAdminVerificationEmail({
        email: record.email,
        displayName: record.displayName,
        username: record.username,
        code,
      }).catch(err => console.error("Async email dispatch error:", err));

      return res.json({
        success: true,
        message: '4 haneli doğrulama kodu oluşturuldu ve yetkili admin destek birimine (golabsdestek@outlook.com) iletildi.',
        expiresAt,
      });
    } catch (e: any) {
      console.error('Send verification code error:', e);
      return res.status(500).json({ success: false, error: 'Doğrulama kodu oluşturulurken bir hata oluştu.' });
    }
  });

  app.post('/api/verify-code', (req, res) => {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({ success: false, error: 'Kullanıcı kimliği ve 4 haneli kod gereklidir.' });
      }

      const record = verificationStore.get(userId);
      const now = Date.now();

      if (!record || record.isUsed) {
        return res.status(400).json({ 
          success: false, 
          error: 'Aktif bir doğrulama kodu bulunamadı. Lütfen yeni bir kod isteyin.' 
        });
      }

      // Check 10-minute expiry
      if (now > record.expiresAt) {
        record.status = 'expired';
        record.isUsed = true;
        return res.status(400).json({ 
          success: false, 
          error: 'Bu doğrulama kodunun 10 dakikalık süresi doldu. Lütfen yeni bir kod isteyin.' 
        });
      }

      // Check 5-attempt limit
      if (record.attempts >= record.maxAttempts) {
        record.status = 'failed';
        record.isUsed = true;
        return res.status(400).json({ 
          success: false, 
          error: '5 kez hatalı kod girildiği için bu kod iptal edildi. Lütfen yeni bir kod isteyin.',
          remainingAttempts: 0 
        });
      }

      const inputCode = String(code).trim();

      // Check code match
      if (inputCode !== record.code) {
        record.attempts += 1;
        const remainingAttempts = Math.max(0, record.maxAttempts - record.attempts);

        if (remainingAttempts <= 0) {
          record.status = 'failed';
          record.isUsed = true;
          return res.status(400).json({ 
            success: false, 
            error: 'Hatalı kod! 5 hatalı deneme hakkınız doldu, kod iptal edildi. Lütfen yeni kod isteyin.',
            remainingAttempts: 0 
          });
        }

        return res.status(400).json({ 
          success: false, 
          error: `Hatalı doğrulama kodu. Kalan deneme hakkı: ${remainingAttempts}`,
          remainingAttempts 
        });
      }

      // Successful verification
      record.isUsed = true;
      record.status = 'verified';

      return res.json({ 
        success: true, 
        message: 'Doğrulama başarılı! E-posta adresiniz onaylandı.' 
      });
    } catch (e: any) {
      console.error('Verify code error:', e);
      return res.status(500).json({ success: false, error: 'Doğrulama işlemi sırasında hata oluştu.' });
    }
  });

  app.get('/api/verification-status/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const record = verificationStore.get(userId);
      if (!record) {
        return res.json({ hasPendingCode: false });
      }
      const now = Date.now();
      const isExpired = now > record.expiresAt;
      const isExhausted = record.attempts >= record.maxAttempts;
      const isValid = !record.isUsed && !isExpired && !isExhausted;

      return res.json({
        hasPendingCode: isValid,
        expiresAt: record.expiresAt,
        remainingAttempts: Math.max(0, record.maxAttempts - record.attempts),
        status: record.status,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Durum kontrolü başarısız oldu.' });
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
            model: 'openai/gpt-oss-20b',
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
