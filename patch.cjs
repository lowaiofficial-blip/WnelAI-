const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const target = `    } catch (error: any) {
      console.error('Chat API Error:', error);
      // If headers are not sent, send 500
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'An error occurred' });
      } else {
        res.write(\`data: \${JSON.stringify({ text: '\\n[Error: Model temporarily unavailable]' })}\\n\\n\`);
        res.write('data: [DONE]\\n\\n');
        res.end();
      }
    }
  });

  // Vite middleware for development`;

const replacement = `    } catch (error: any) {
      console.error('Chat API Error:', error);
      // If headers are not sent, send 500
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'An error occurred' });
      } else {
        res.write(\`data: \${JSON.stringify({ text: '\\n[Error: Model temporarily unavailable]' })}\\n\\n\`);
        res.write('data: [DONE]\\n\\n');
        res.end();
      }
    }
  });

  app.post('/api/generate-title', async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || messages.length === 0) {
        return res.status(400).json({ title: "Yeni Sohbet" });
      }

      const prompt = \`Lütfen aşağıdaki sohbetin içeriğini anlatan 2-5 kelimelik, çok kısa, profesyonel, anlamlı ve doğal Türkçe bir başlık oluştur. 
Asla "Selam", "Merhaba", "Naber" gibi basit başlıklar kullanma. Konuyu özetle.
Sadece başlığı döndür, tırnak işareti, nokta veya ekstra metin koyma.

Sohbet:
\${messages.map((m: any) => \`\${m.role}: \${m.content}\`).join('\\n')}
\`;

      const geminiModel = 'gemini-3.1-pro-preview';
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: prompt
      });
      
      let title = response.text?.trim() || "Yeni Sohbet";
      title = title.replace(/^["']|["']$/g, ''); // Remove quotes if any
      
      res.json({ title });
    } catch (error) {
      console.error('Title generation error:', error);
      res.json({ title: "Yeni Sohbet" }); // Fallback
    }
  });

  // Vite middleware for development`;

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content);
console.log('Patched server.ts');
