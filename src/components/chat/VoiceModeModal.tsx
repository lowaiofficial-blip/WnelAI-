import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  VolumeX, 
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Rocket,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  TTSQueue, 
  isSpeechRecognitionSupported 
} from '../../lib/speech';
import { Model } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getVoiceUsageStatus, 
  formatSecondsToTime, 
  recordVoiceUsageLocal 
} from '../../lib/usageLimits';
import { recordVoiceUsageInDb } from '../../lib/firebase/firestore';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<string | undefined>;
  selectedModel: Model;
  onOpenGoModal?: () => void;
}

// Strict Voice State Machine
export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'AI_SPEAKING' | 'STOPPING';

export function VoiceModeModal({
  isOpen,
  onClose,
  onSendMessage,
  selectedModel,
  onOpenGoModal
}: VoiceModeModalProps) {
  const { user, profile, isGo } = useAuth();
  
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real-time authoritative remaining seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const status = getVoiceUsageStatus(profile, isGo ? 'go' : 'free', user?.uid);
    return status.remainingSeconds;
  });
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);

  // References for state machine and hardware control (avoids state updater side-effects)
  const stateRef = useRef<VoiceState>('IDLE');
  const isMutedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const ttsQueueRef = useRef<TTSQueue | null>(null);
  
  // Usage tracking
  const uncommittedSecondsRef = useRef<number>(0);
  const remainingSecondsRef = useRef<number>(remainingSeconds);

  // Synchronize state references
  useEffect(() => {
    stateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  // Commit consumed seconds to Firestore and local storage
  const commitUsageToStorage = useCallback(async (deltaSecs: number) => {
    if (deltaSecs <= 0) return;
    const plan = isGo ? 'go' : 'free';
    
    // 1. Optimistic local update
    if (user?.uid) {
      recordVoiceUsageLocal(user.uid, deltaSecs);
    }

    // 2. Persistent Firestore atomic update
    if (user?.uid) {
      try {
        await recordVoiceUsageInDb(user.uid, deltaSecs, plan);
      } catch (err) {
        console.error('Error committing voice usage to database:', err);
      }
    }
  }, [user?.uid, isGo]);

  // Flush any pending uncommitted seconds
  const flushUncommittedUsage = useCallback(() => {
    if (uncommittedSecondsRef.current > 0) {
      const toCommit = uncommittedSecondsRef.current;
      uncommittedSecondsRef.current = 0;
      commitUsageToStorage(toCommit);
    }
  }, [commitUsageToStorage]);

  // Safely stop and detach Speech Recognition without triggering redundant onend/onerror loops
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onstart = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Complete cleanup of all media, TTS, and recognition instances
  const cleanup = useCallback(() => {
    stateRef.current = 'STOPPING';
    setVoiceState('STOPPING');
    stopRecognition();

    if (ttsQueueRef.current) {
      ttsQueueRef.current.destroy();
      ttsQueueRef.current = null;
    }

    transcriptRef.current = '';
    setTranscript('');
    setAiResponse('');
    setErrorMessage(null);
    flushUncommittedUsage();
    
    if (isMountedRef.current) {
      setVoiceState('IDLE');
      stateRef.current = 'IDLE';
    }
  }, [stopRecognition, flushUncommittedUsage]);

  // Handle user speech submission and AI audio streaming queue
  const handleUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim() || remainingSecondsRef.current <= 0) {
      stateRef.current = 'IDLE';
      setVoiceState('IDLE');
      return;
    }

    // STRICT: In PROCESSING state, mic is completely disabled
    stateRef.current = 'PROCESSING';
    setVoiceState('PROCESSING');
    stopRecognition();

    try {
      const responseText = await onSendMessage(userText);
      
      if (!isMountedRef.current || (stateRef.current as VoiceState) === 'STOPPING') return;

      if (remainingSecondsRef.current <= 0) {
        setIsLimitReached(true);
        cleanup();
        return;
      }

      if (responseText && responseText.trim()) {
        setAiResponse(responseText);
        stateRef.current = 'AI_SPEAKING';
        setVoiceState('AI_SPEAKING');

        // Enqueue into TTS queue (plays sentences seamlessly without restarting or beeping)
        if (ttsQueueRef.current) {
          ttsQueueRef.current.enqueueText(responseText);
        }
      } else {
        // Empty response fallback
        stateRef.current = 'IDLE';
        setVoiceState('IDLE');
      }
    } catch (err) {
      console.error('Voice message error:', err);
      if (isMountedRef.current) {
        stateRef.current = 'IDLE';
        setVoiceState('IDLE');
        setErrorMessage('Yanıt alınırken bir hata oluştu.');
      }
    }
  }, [onSendMessage, cleanup, stopRecognition]);

  // Start speech recognition strictly in LISTENING state
  const startListening = useCallback(() => {
    if (!isMountedRef.current || isMutedRef.current || remainingSecondsRef.current <= 0) {
      return;
    }

    // Ensure TTS is stopped before listening
    if (ttsQueueRef.current) {
      ttsQueueRef.current.stop();
    }

    // Safely abort previous recognition if any
    stopRecognition();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        stateRef.current = 'LISTENING';
        setVoiceState('LISTENING');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        if (!isMountedRef.current || stateRef.current !== 'LISTENING') return;
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (!isMountedRef.current) return;
        if (event.error === 'not-allowed') {
          setErrorMessage('Mikrofon izni verilmedi. Lütfen tarayıcıdan mikrofon izni verin.');
          stopRecognition();
          stateRef.current = 'IDLE';
          setVoiceState('IDLE');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        
        // Cleanly process speech without executing parent setState inside a state reducer!
        if (stateRef.current === 'LISTENING') {
          const finalSpeech = transcriptRef.current.trim();
          stopRecognition();
          
          if (finalSpeech && remainingSecondsRef.current > 0) {
            handleUserSpeech(finalSpeech);
          } else {
            stateRef.current = 'IDLE';
            setVoiceState('IDLE');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      stopRecognition();
      stateRef.current = 'IDLE';
      setVoiceState('IDLE');
    }
  }, [stopRecognition, handleUserSpeech]);

  // Initialize and wire TTSQueue
  useEffect(() => {
    ttsQueueRef.current = new TTSQueue({
      onStart: () => {
        if (!isMountedRef.current) return;
        stateRef.current = 'AI_SPEAKING';
        setVoiceState('AI_SPEAKING');
        // Double check mic is completely off while AI speaks
        stopRecognition();
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        // Flush audio usage seconds when AI completes its speech turn
        flushUncommittedUsage();

        if (remainingSecondsRef.current <= 0) {
          setIsLimitReached(true);
          cleanup();
          return;
        }

        // Transition to IDLE
        stateRef.current = 'IDLE';
        setVoiceState('IDLE');

        // Automatically start listening for natural conversation after a brief polite pause
        setTimeout(() => {
          if (
            isMountedRef.current && 
            stateRef.current === 'IDLE' && 
            !isMutedRef.current && 
            remainingSecondsRef.current > 0
          ) {
            transcriptRef.current = '';
            setTranscript('');
            startListening();
          }
        }, 400);
      },
      onError: (err) => {
        console.warn('TTS Queue notification:', err);
      }
    });

    return () => {
      if (ttsQueueRef.current) {
        ttsQueueRef.current.destroy();
        ttsQueueRef.current = null;
      }
    };
  }, [flushUncommittedUsage, cleanup, startListening, stopRecognition]);

  // Initialize session whenever modal opens/closes
  useEffect(() => {
    isMountedRef.current = true;
    if (!isOpen) {
      cleanup();
      return;
    }

    // Refresh limits from current profile / local state
    const usage = getVoiceUsageStatus(profile, isGo ? 'go' : 'free', user?.uid);
    setRemainingSeconds(usage.remainingSeconds);
    remainingSecondsRef.current = usage.remainingSeconds;
    uncommittedSecondsRef.current = 0;
    transcriptRef.current = '';

    if (usage.remainingSeconds <= 0) {
      setIsLimitReached(true);
      return;
    }

    setIsLimitReached(false);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage('Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanın.');
      return;
    }

    // Start initial listening
    startListening();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [isOpen, profile, isGo, user?.uid, cleanup, startListening]);

  // Periodic usage countdown timer while user or AI is actively speaking
  useEffect(() => {
    if (!isOpen || isLimitReached) return;

    // Only count down while speech recognition is actively listening or speech synthesis is actively talking
    const isActivelyConsuming = voiceState === 'LISTENING' || voiceState === 'AI_SPEAKING';
    if (!isActivelyConsuming) return;

    const timer = setInterval(() => {
      if (!isMountedRef.current) return;

      uncommittedSecondsRef.current += 1;

      // Periodic sync every 10 seconds
      if (uncommittedSecondsRef.current >= 10) {
        const delta = uncommittedSecondsRef.current;
        uncommittedSecondsRef.current = 0;
        commitUsageToStorage(delta);
      }

      setRemainingSeconds(prev => {
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });

      if (remainingSecondsRef.current - 1 <= 0) {
        setIsLimitReached(true);
        cleanup();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, voiceState, isLimitReached, cleanup, commitUsageToStorage]);

  // Toggle Mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      if (voiceState === 'IDLE') {
        startListening();
      }
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      stopRecognition();
      if (ttsQueueRef.current) {
        ttsQueueRef.current.stop();
      }
      stateRef.current = 'IDLE';
      setVoiceState('IDLE');
    }
  };

  // Central Orb Click Handler (supports instant interruption and quick send)
  const handleOrbClick = () => {
    if (isLimitReached) return;

    if (voiceState === 'AI_SPEAKING') {
      // User tapped to interrupt AI -> stop audio instantly and listen to user
      if (ttsQueueRef.current) {
        ttsQueueRef.current.stop();
      }
      flushUncommittedUsage();
      stateRef.current = 'IDLE';
      setVoiceState('IDLE');
      if (!isMuted) {
        startListening();
      }
    } else if (voiceState === 'LISTENING') {
      // User tapped to finish speaking and send immediately
      const finalSpeech = transcriptRef.current.trim();
      if (finalSpeech) {
        stopRecognition();
        handleUserSpeech(finalSpeech);
      } else {
        stopRecognition();
        stateRef.current = 'IDLE';
        setVoiceState('IDLE');
      }
    } else if (voiceState === 'IDLE') {
      // Tap to start speaking
      if (!isMuted) {
        startListening();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none">
        
        {/* Top Header Bar */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10 max-w-4xl mx-auto">
          
          {/* Status Badge: WnelAI ile Konuşuyorsun */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-200 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isLimitReached ? "bg-red-400" : (voiceState === 'LISTENING' ? "bg-sky-400" : voiceState === 'AI_SPEAKING' ? "bg-indigo-400" : "bg-green-400")
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isLimitReached ? "bg-red-500" : (voiceState === 'LISTENING' ? "bg-sky-500" : voiceState === 'AI_SPEAKING' ? "bg-indigo-500" : "bg-green-500")
              )} />
            </span>
            <span className="tracking-tight">🎙️ WnelAI ile konuşuyorsun</span>
          </div>

          {/* Right Controls: Timer Pill & Close Button */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Remaining Time Pill */}
            <div className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border transition-all",
              remainingSeconds <= 30
                ? "bg-red-500/15 border-red-500/30 text-red-300 animate-pulse"
                : remainingSeconds <= 60
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-white/[0.06] border-white/10 text-zinc-300"
            )}>
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>Kalan süre:</span>
              <span className="font-bold text-white tracking-wider">
                {formatSecondsToTime(remainingSeconds)}
              </span>
              {isGo && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-sans font-semibold">
                  Go
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                cleanup();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/10"
              title="Sesli Modu Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Content: Either Active Voice Visualizer OR Limit Reached Card */}
        {!isLimitReached ? (
          <div className="flex flex-col items-center justify-center w-full max-w-lg px-4 text-center">
            
            {/* Main Visualizer Orb Container */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              
              {/* Outer Multi-layered Animated Pulse Rings */}
              {voiceState === 'LISTENING' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-full border border-sky-400/40"
                    animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                </>
              )}

              {voiceState === 'AI_SPEAKING' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 to-sky-500/30 blur-2xl"
                    animate={{ scale: [1, 1.45, 1.1, 1], opacity: [0.4, 0.9, 0.5, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-indigo-400/50"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </>
              )}

              {voiceState === 'PROCESSING' && (
                <motion.div
                  className="absolute inset-2 rounded-full border border-dashed border-sky-400/60"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Central Interactive Sphere */}
              <motion.div
                onClick={handleOrbClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative z-10 w-36 h-36 rounded-full cursor-pointer flex items-center justify-center transition-all duration-500 shadow-2xl",
                  voiceState === 'LISTENING' && "bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-sky-500/50",
                  voiceState === 'AI_SPEAKING' && "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/60",
                  voiceState === 'PROCESSING' && "bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border border-white/20",
                  voiceState === 'IDLE' && "bg-[#1c1c24] border border-white/10 hover:border-white/30"
                )}
              >
                {/* Equalizer Wave / State Symbol */}
                {voiceState === 'AI_SPEAKING' ? (
                  <div className="flex items-center gap-1.5">
                    <motion.span 
                      animate={{ height: [12, 36, 16, 28, 12] }} 
                      transition={{ duration: 0.7, repeat: Infinity }} 
                      className="w-1.5 bg-white rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [24, 48, 20, 40, 24] }} 
                      transition={{ duration: 0.6, repeat: Infinity }} 
                      className="w-1.5 bg-white rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [32, 16, 44, 20, 32] }} 
                      transition={{ duration: 0.8, repeat: Infinity }} 
                      className="w-1.5 bg-white rounded-full" 
                    />
                    <motion.span 
                      animate={{ height: [16, 36, 12, 30, 16] }} 
                      transition={{ duration: 0.65, repeat: Infinity }} 
                      className="w-1.5 bg-white rounded-full" 
                    />
                  </div>
                ) : voiceState === 'LISTENING' ? (
                  <div className="flex items-center gap-1">
                    <motion.span 
                      animate={{ scaleY: [0.6, 1.4, 0.6] }} 
                      transition={{ duration: 0.8, repeat: Infinity }} 
                      className="w-1.5 h-6 bg-white rounded-full" 
                    />
                    <motion.span 
                      animate={{ scaleY: [1, 1.8, 1] }} 
                      transition={{ duration: 0.6, repeat: Infinity }} 
                      className="w-1.5 h-8 bg-white rounded-full" 
                    />
                    <motion.span 
                      animate={{ scaleY: [0.6, 1.4, 0.6] }} 
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} 
                      className="w-1.5 h-6 bg-white rounded-full" 
                    />
                  </div>
                ) : voiceState === 'PROCESSING' ? (
                  <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                ) : (
                  <Mic className="w-8 h-8 text-zinc-400" />
                )}
              </motion.div>
            </div>

            {/* Status Label */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {voiceState === 'LISTENING' && 'Sizi Dinliyor...'}
                {voiceState === 'PROCESSING' && 'WnelAI Düşünüyor...'}
                {voiceState === 'AI_SPEAKING' && 'WnelAI Konuşuyor'}
                {voiceState === 'IDLE' && (isMuted ? 'Mikrofon Kapalı' : 'Konuşmak İçin Dokunun')}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {voiceState === 'AI_SPEAKING' ? 'Durdurmak için küreye dokunun' : 'İstediğiniz zaman doğrudan konuşabilirsiniz'}
              </p>
            </div>

            {/* Transcript / Subtitles Live Box */}
            <div className="w-full min-h-[68px] max-h-[120px] overflow-y-auto px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-200 leading-relaxed mb-6 scrollbar-none flex items-center justify-center">
              {transcript ? (
                <p className="italic text-zinc-100">"{transcript}"</p>
              ) : aiResponse ? (
                <p className="text-zinc-300 line-clamp-3">{aiResponse}</p>
              ) : (
                <p className="text-xs text-zinc-500">Sesiniz buraya aktarılacak...</p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bottom Floating Control Buttons */}
            <div className="flex items-center gap-4">
              {/* Mute/Unmute Mic Button */}
              <button
                onClick={toggleMute}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg",
                  isMuted 
                    ? "bg-red-500/20 border border-red-500/40 text-red-400" 
                    : "bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-300 hover:text-white"
                )}
                title={isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Interrupt / Stop Speaking Button */}
              <button
                onClick={() => {
                  if (ttsQueueRef.current) {
                    ttsQueueRef.current.stop();
                  }
                  flushUncommittedUsage();
                  stateRef.current = 'IDLE';
                  setVoiceState('IDLE');
                  if (!isMuted) {
                    startListening();
                  }
                }}
                className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg"
                title="Sustur & Yeniden Dinle"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Limit Reached Card UI */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#16161b] border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center space-y-5"
          >
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                🎙️ Günlük sesli konuşma limitiniz doldu
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
                WnelAI Go ile günlük <span className="text-white font-semibold">60 dakikaya kadar</span> kesintisiz sesli konuşabilirsiniz.
              </p>
            </div>

            {/* Go Feature Highlights Box */}
            <div className="w-full bg-[#1e1e26] border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5b9dfd]">
                <Rocket className="w-4 h-4" />
                <span>WnelAI Go Avantajları</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>60 dk/gün</strong> sesli AI konuşma süresi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Daha yüksek günlük sohbet limitleri</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dosya ve görsel yükleme desteği</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Daha fazla Düşünen Mod kullanımı</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Özel 🚀 Go profil rozeti</span>
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="w-full space-y-2.5 pt-1">
              <button
                onClick={() => {
                  cleanup();
                  onClose();
                  if (onOpenGoModal) {
                    onOpenGoModal();
                  }
                }}
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-zinc-100 active:scale-[0.98] text-black font-bold text-sm transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-sky-600 fill-sky-600/20" />
                <span>WnelAI Go'ya Geç</span>
              </button>

              <button
                onClick={() => {
                  cleanup();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </AnimatePresence>
  );
}
