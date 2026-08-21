import React, { useRef, useEffect } from 'react';
import { Plus, Send, StopCircle, Mic, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function InputArea({ onSend, isLoading }: InputAreaProps) {
  const [input, setInput] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-6 pt-2">
      <div className="relative glass-input rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 flex items-end gap-2 transition-all duration-300">
        
        {/* Plus / Add Attachment Button */}
        <div className="flex items-center gap-1 shrink-0 mb-0.5">
          <button 
            type="button"
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 rounded-xl sm:rounded-2xl transition-all cursor-pointer border border-white/5 hover:border-sky-500/30 group relative"
            title="Dosya veya Görsel Ekle"
          >
            <Plus className="w-4 h-4 text-sky-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0c1222] text-zinc-200 text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-sky-500/20 shadow-lg">
              Dosya Ekle
            </span>
          </button>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="WnelAI'ye bir mesaj yazın..."
          className="flex-1 max-h-[220px] bg-transparent text-white placeholder:text-zinc-500 resize-none outline-none py-2 px-2 sm:px-3 text-sm sm:text-[15px] leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
          rows={1}
        />

        {/* Action Button (Send / Stop / Mic) */}
        <div className="flex items-center gap-1 shrink-0 mb-0.5">
          {isLoading ? (
            <button 
              type="button"
              className="w-9 h-9 flex items-center justify-center bg-red-500/20 text-red-300 hover:text-white hover:bg-red-500/30 rounded-xl sm:rounded-2xl transition-all cursor-pointer border border-red-500/30 shadow-sm"
              title="Cevap Üretimini Durdur"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer border",
                input.trim() 
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 border-sky-400/40 hover:scale-105 active:scale-95" 
                  : "bg-white/[0.04] text-zinc-600 border-white/5 cursor-not-allowed"
              )}
              title={input.trim() ? "Gönder" : "Sesli Giriş"}
            >
              {input.trim() ? (
                <Send className="w-4 h-4 translate-x-0.5 -translate-y-0.5" />
              ) : (
                <Mic className="w-4 h-4 text-zinc-500" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-2.5">
        <p className="text-[11px] text-zinc-500 font-medium tracking-wide flex items-center justify-center gap-1">
          <span>WnelAI yanlış bilgi verebilir. Önemli bilgileri kontrol ediniz.</span>
        </p>
      </div>
    </div>
  );
}
