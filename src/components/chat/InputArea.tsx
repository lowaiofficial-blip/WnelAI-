import React, { useRef, useEffect } from 'react';
import { Paperclip, Image as ImageIcon, Mic, Send, StopCircle, Plus } from 'lucide-react';
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 pb-4 md:pb-6 pt-2">
      <div className="relative bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20 transition-all p-2 flex items-end gap-2">
        
        <div className="flex items-center gap-1 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center text-zinc-300 bg-white/5 hover:bg-white/10 rounded-full transition-colors group relative border border-white/5">
            <Plus className="w-5 h-5" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">Ekle</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bugün size nasıl yardımcı olabilirim?"
          className="flex-1 max-h-[200px] bg-transparent text-white placeholder:text-zinc-500 resize-none outline-none py-2 px-3 text-[15px] leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex items-center"
          rows={1}
        />

        <div className="flex items-center gap-1 shrink-0">
          {isLoading ? (
            <button className="w-9 h-9 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors border border-white/5">
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg border border-transparent",
                input.trim() 
                  ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/25 hover:scale-105" 
                  : "bg-blue-500/20 text-blue-200 cursor-not-allowed"
              )}
            >
              {input.trim() ? <Send className="w-4 h-4 translate-x-0.5 -translate-y-0.5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
          Wnel Studio'yu kullanarak Kullanım Koşulları ve Gizlilik Politikası kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
