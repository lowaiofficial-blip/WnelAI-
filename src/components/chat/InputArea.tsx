import React, { useRef, useEffect, useState } from 'react';
import { 
  Paperclip,
  SlidersHorizontal,
  ArrowUp, 
  StopCircle, 
  Mic, 
  MicOff,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getIstanbulFormattedTime } from '../../lib/thinkingCooldown';
import { isSpeechRecognitionSupported } from '../../lib/speech';

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  thinkingCooldownUntil?: number;
  isGo?: boolean;
  onAttachClick?: () => void;
  onOpenGoModal?: () => void;
  onOpenModelSheet?: () => void;
  onOpenVoiceMode?: () => void;
}

export function InputArea({ 
  onSend, 
  isLoading, 
  thinkingCooldownUntil = 0,
  isGo = false,
  onAttachClick,
  onOpenGoModal,
  onOpenModelSheet,
  onOpenVoiceMode
}: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isCooldownActive = !isGo && thinkingCooldownUntil > Date.now();
  const istanbulTime = isCooldownActive ? getIstanbulFormattedTime(thinkingCooldownUntil) : '';

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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleSend = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
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

  const handleAttachClick = () => {
    if (onAttachClick) {
      onAttachClick();
    } else if (isGo) {
      fileInputRef.current?.click();
    }
  };

  const startVoiceRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Tarayıcınız ses tanımayı desteklemiyor.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = true;
      recognition.interimResults = true;

      const baseText = input ? input.trim() + ' ' : '';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interimTranscript += event.results[i][0].transcript;
        }
        if (interimTranscript) {
          setInput(baseText + interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Mikrofon erişim izni verilmedi.');
          setTimeout(() => setSpeechError(null), 4000);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech start error:', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 pb-2 pt-1 select-none">
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

      {/* Speech error toast if any */}
      {speechError && (
        <div className="mb-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-xl text-center animate-in fade-in">
          {speechError}
        </div>
      )}

      {/* Limit Reached Card UI (Exact replica of user reference image) */}
      {isCooldownActive && !isBannerDismissed && (
        <div className="mb-3.5 bg-[#212124] border border-white/[0.06] rounded-[24px] p-5 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 pr-2">
              <h3 className="text-white text-[15px] font-semibold tracking-tight">
                Wnel3.8-Max (Düşünen Mod) plan limitinize ulaştınız.
              </h3>
              <p className="text-[#a1a1aa] text-[13.5px] leading-relaxed">
                Limitiniz saat <span className="text-white font-medium">{istanbulTime}</span> sonrasında sıfırlanana kadar yanıtlar hızlı model kullanılarak verilecektir.
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
              title="Kapat"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Action Button: Get Pro / Go'ya Geç */}
          <div className="mt-4">
            <button
              onClick={() => onOpenGoModal && onOpenGoModal()}
              className="inline-flex items-center gap-2 bg-[#2e2e34] hover:bg-[#3a3a42] active:scale-95 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-sky-400 fill-sky-400/20" />
              <span>Go'ya Geç</span>
            </button>
          </div>
        </div>
      )}

      {/* Modern Chat Box (Exact replica of user reference image) */}
      <div className={cn(
        "relative bg-[#212124] border rounded-[28px] p-4 flex flex-col gap-3 transition-all duration-300 shadow-2xl shadow-black/80",
        isRecording 
          ? "border-red-500/50 shadow-red-500/10 ring-1 ring-red-500/30" 
          : "border-white/[0.06] hover:border-white/[0.12] focus-within:border-white/20"
      )}>
        
        {/* Top Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Dinleniyor... Konuşabilirsiniz..." : "Bugün size nasıl yardımcı olabilirim?"}
          className="w-full min-h-[30px] max-h-[160px] bg-transparent text-white placeholder:text-[#8e8e93] resize-none outline-none text-[15.5px] leading-relaxed overflow-y-auto scrollbar-none"
          rows={1}
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Left Actions: Attachment & Sliders/Model Tools */}
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              className="w-9 h-9 rounded-full bg-[#2a2a30] hover:bg-[#34343c] active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Dosya veya Görsel Ekle"
            >
              <Paperclip className="w-4.5 h-4.5 stroke-[2] -rotate-45" />
            </button>

            {/* Models / Sliders Settings Button */}
            <button
              type="button"
              onClick={() => onOpenModelSheet && onOpenModelSheet()}
              className="w-9 h-9 rounded-full bg-[#2a2a30] hover:bg-[#34343c] active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Model Ayarları"
            >
              <SlidersHorizontal className="w-4.5 h-4.5 stroke-[2]" />
            </button>
          </div>

          {/* Right Actions: Mic & Solid Voice Equalizer / Send */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button 
                type="button"
                className="w-9 h-9 rounded-full bg-[#2a2a30] hover:bg-[#34343c] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Durdur"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : input.trim() ? (
              <button 
                type="button"
                onClick={handleSend}
                className="w-9 h-9 rounded-full bg-white hover:bg-zinc-200 active:scale-95 flex items-center justify-center text-black transition-all cursor-pointer shadow-lg shadow-white/20"
                title="Gönder"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </button>
            ) : (
              <>
                {/* Mic Icon Button with Live Speech Recording */}
                <button 
                  type="button"
                  onClick={handleVoiceToggle}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95",
                    isRecording 
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40" 
                      : "bg-[#2a2a30] hover:bg-[#34343c] text-zinc-300 hover:text-white"
                  )}
                  title={isRecording ? "Kaydı Durdur" : "Sesli Giriş Yap (Mikrofon)"}
                >
                  {isRecording ? <MicOff className="w-4.5 h-4.5 stroke-[2]" /> : <Mic className="w-4.5 h-4.5 stroke-[2]" />}
                </button>

                {/* Solid White Audio Equalizer Circle -> Opens Interactive Voice Mode */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenVoiceMode) {
                      onOpenVoiceMode();
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-white hover:bg-zinc-200 active:scale-95 flex items-center justify-center text-black transition-all cursor-pointer shadow-lg shadow-white/10 group"
                  title="WnelAI Canlı Sesli Sohbet Modu"
                >
                  <div className="flex items-center justify-center gap-[2.5px]">
                    <span className="w-[2.5px] h-2 bg-black rounded-full group-hover:h-3 transition-all" />
                    <span className="w-[2.5px] h-4 bg-black rounded-full group-hover:h-2 transition-all" />
                    <span className="w-[2.5px] h-2.5 bg-black rounded-full group-hover:h-4 transition-all" />
                    <span className="w-[2.5px] h-1.5 bg-black rounded-full group-hover:h-2.5 transition-all" />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtle Disclaimer */}
      <div className="text-center mt-2.5">
        <p className="text-[11px] text-zinc-500 font-normal">
          WnelAI hata yapabilir. Önemli bilgileri kontrol edin.
        </p>
      </div>
    </div>
  );
}
