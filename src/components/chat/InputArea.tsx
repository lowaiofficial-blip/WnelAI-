import React, { useRef, useEffect, useState } from 'react';
import { Plus, Send, StopCircle, Mic, Sparkles, Clock, Lock, Zap, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getIstanbulFormattedTime, formatRemainingTime } from '../../lib/thinkingCooldown';

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  thinkingCooldownUntil?: number;
  isGo?: boolean;
  onAttachClick?: () => void;
}

export function InputArea({ 
  onSend, 
  isLoading, 
  thinkingCooldownUntil = 0,
  isGo = false,
  onAttachClick
}: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCooldownActive = thinkingCooldownUntil > Date.now();
  const istanbulTime = isCooldownActive ? getIstanbulFormattedTime(thinkingCooldownUntil) : '';
  const remainingMs = Math.max(0, thinkingCooldownUntil - Date.now());

  // Reset banner dismissal whenever a new cooldown timestamp is triggered
  useEffect(() => {
    if (thinkingCooldownUntil > Date.now()) {
      setIsBannerDismissed(false);
    }
  }, [thinkingCooldownUntil]);

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

  const handlePlusClick = () => {
    if (onAttachClick) {
      onAttachClick();
    } else if (isGo) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 sm:pb-6 pt-2">
      {/* Hidden file input for Go users */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setInput(prev => prev ? `${prev} [Ekli Dosya: ${file.name}]` : `[Ekli Dosya: ${file.name}] `);
          }
        }}
      />

      {/* Thinking Mode Cooldown Banner */}
      {isCooldownActive && !isBannerDismissed && (
        <div className="mb-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/25 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-lg shadow-amber-950/20 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-amber-200/90 leading-snug text-[12px] sm:text-[13px]">
              Saat <strong className="text-white bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-100 font-bold">{istanbulTime}</strong>'a kadar düşünen mod limitiniz dolmuştur. <span className="text-zinc-400 font-normal">(Hızlı moda geçildi)</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300 font-mono text-[11px] font-medium">
                {formatRemainingTime(remainingMs)}
              </span>
            </div>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Mesajı gizle (Düşünen mod kilitli kalmaya devam eder)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-1.5 flex items-end gap-2 transition-all duration-300 shadow-2xl shadow-black/40">
        
        {/* Plus / Add Attachment Button */}
        <div className="flex items-center shrink-0 mb-0.5">
          <button 
            type="button"
            onClick={handlePlusClick}
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
