const fs = require('fs');
const content = fs.readFileSync('src/components/chat/InputArea.tsx', 'utf8');

const replacement = `  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 sm:pb-6 pt-2">
      <div className="relative bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-1.5 flex items-end gap-2 transition-all duration-300 shadow-2xl shadow-black/40">
        
        {/* Plus / Add Attachment Button */}
        <div className="flex items-center shrink-0 mb-0.5">
          <button 
            type="button"
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 rounded-full transition-all cursor-pointer group"
            title="Dosya veya Görsel Ekle"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bugün size nasıl yardımcı olabilirim?"
          className="flex-1 max-h-[160px] bg-transparent text-white placeholder:text-zinc-500 resize-none outline-none py-3 px-1 text-[15px] leading-relaxed overflow-y-auto scrollbar-none"
          rows={1}
        />

        {/* Action Button (Send / Stop / Mic) */}
        <div className="flex items-center gap-1.5 shrink-0 mb-0.5 mr-0.5">
          {isLoading ? (
            <button 
              type="button"
              className="w-10 h-10 flex items-center justify-center bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-full transition-all cursor-pointer"
              title="Cevap Üretimini Durdur"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <>
              {!input.trim() && (
                <button 
                  type="button"
                  className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer rounded-full hover:bg-white/5"
                  title="Sesli Giriş"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              <button 
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300",
                  input.trim() 
                    ? "bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-500 text-white cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95" 
                    : "hidden"
                )}
                title="Gönder"
              >
                {input.trim() && (
                  <Send className="w-4 h-4 translate-x-0.5 -translate-y-0.5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="text-center mt-3">
        <p className="text-[11px] text-zinc-500/70 font-medium tracking-wide">
          WnelAI'ye mesaj göndererek, <span className="underline decoration-white/20 underline-offset-2 cursor-pointer hover:text-zinc-300">Kullanım Koşulları</span> metnini kabul eder ve 
          <br className="sm:hidden" /> <span className="underline decoration-white/20 underline-offset-2 cursor-pointer hover:text-zinc-300">Gizlilik Politikası</span>'nı okumuş olduğunuzu onaylarsınız.
        </p>
      </div>
    </div>
  );
}
`;

const startIndex = content.indexOf('  return (');
if (startIndex !== -1) {
  const newContent = content.substring(0, startIndex) + replacement;
  fs.writeFileSync('src/components/chat/InputArea.tsx', newContent);
  console.log("Patched successfully");
} else {
  console.log("Could not find start index");
}
