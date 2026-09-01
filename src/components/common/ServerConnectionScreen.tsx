import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../../contexts/BrandingContext';

interface ServerConnectionScreenProps {
  onAdminUnlock?: () => void;
}

type ConnectionStage = 'logo' | 'connecting' | 'error';

/**
 * ServerConnectionScreen
 * 
 * Implements a high-quality, minimalist startup experience reminiscent of classic
 * Google/Android system connection screens:
 * 
 * 1. Initial Launch: WnelAI brand logo centered on pure #FFFFFF for 1.25 seconds.
 * 2. Connecting State: Minimalist spinner + "Sunucuya bağlanılıyor..." for 5 seconds.
 * 3. Error State: Clean SVG warning triangle + "Sunucuya bağlanılamıyor" + "↻ Tekrar dene" button.
 * 4. Retry Action: Cycles back to "connecting" (5s) -> "error".
 */
export function ServerConnectionScreen({ onAdminUnlock }: ServerConnectionScreenProps) {
  const { getBustedLogoUrl } = useBranding();
  const logoSrc = getBustedLogoUrl();
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Connection stage: 'logo' (1.25s) -> 'connecting' (5s) -> 'error'
  const [stage, setStage] = useState<ConnectionStage>('logo');

  // Stage transition timers
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (stage === 'logo') {
      // Show brand logo for 1.25 seconds on initial entry
      timer = setTimeout(() => {
        setStage('connecting');
      }, 1250);
    } else if (stage === 'connecting') {
      // Connect attempt for 5 seconds
      timer = setTimeout(() => {
        setStage('error');
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    setStage('connecting');
  }, []);

  // Hidden admin shortcut listener (Alt + A or Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        if (onAdminUnlock) {
          onAdminUnlock();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAdminUnlock]);

  return (
    <main 
      id="server-connection-screen"
      role="main"
      aria-label="WnelAI Sunucu Bağlantı Durumu"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFFFFF] text-[#202124] flex flex-col justify-center items-center px-6 py-8 font-sans select-none overflow-hidden"
    >
      {/* Top-Right Profile Placeholder (Classic Account Silhouette) */}
      <div 
        id="profile-placeholder"
        className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="w-[34px] h-[34px] rounded-full bg-[#e8eaed] flex items-center justify-center overflow-hidden border border-[#dadce0]/80">
          <svg
            className="w-5 h-5 text-[#5f6368] translate-y-0.5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* Head and Shoulders Silhouette */}
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Stage 1: Initial WnelAI Logo Splash (1.25s) */}
        {stage === 'logo' && (
          <motion.div
            key="logo-stage"
            id="brand-splash-container"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              {logoSrc && !logoLoadError ? (
                <img
                  src={logoSrc}
                  alt="WnelAI"
                  onError={() => setLogoLoadError(true)}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="eager"
                />
              ) : (
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-[#202124]"
                  aria-hidden="true"
                >
                  <circle cx="50" cy="18" r="7" fill="currentColor" />
                  <circle cx="28" cy="28" r="5" fill="currentColor" />
                  <circle cx="72" cy="28" r="5" fill="currentColor" />
                  <circle cx="50" cy="85" r="6" fill="currentColor" />
                  <path
                    d="M28 28 C 38 18, 62 18, 72 28 M50 18 L50 38 M20 80 C 40 90, 60 90, 80 80"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 46 C 14 38, 14 62, 28 72 C 40 80, 48 55, 50 48 C 52 55, 60 80, 72 72 C 86 62, 86 38, 78 46 C 70 54, 58 70, 50 60 C 42 70, 30 54, 22 46 Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
          </motion.div>
        )}

        {/* Stage 2: Connecting Spinner (5 seconds) */}
        {stage === 'connecting' && (
          <motion.div
            key="connecting-stage"
            id="connecting-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto"
          >
            {/* Minimal Circular Spinner */}
            <div 
              id="connecting-spinner"
              className="w-9 h-9 sm:w-10 sm:h-10 border-[3px] border-[#e8eaed] border-t-[#5f6368] rounded-full animate-spin mb-5"
              role="status"
              aria-label="Yükleniyor"
            />

            {/* Connecting Text */}
            <p 
              id="connecting-text"
              className="text-[#3c4043] text-sm sm:text-base font-normal tracking-normal"
            >
              Sunucuya bağlanılıyor...
            </p>
          </motion.div>
        )}

        {/* Stage 3: Connection Error (Appears after 5 seconds) */}
        {stage === 'error' && (
          <motion.div
            key="error-stage"
            id="error-container"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center max-w-md w-full mx-auto px-4"
          >
            {/* Minimalist Native SVG Warning Icon (Triangle with Exclamation Mark) */}
            <div 
              id="error-icon-wrapper"
              className="mb-5 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f8f9fa] border border-[#e8eaed] flex items-center justify-center text-[#5f6368]">
                <svg 
                  className="w-7 h-7 sm:w-8 sm:h-8 text-[#5f6368]" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {/* Warning Triangle */}
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  {/* Exclamation point */}
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h1 
              id="error-title"
              className="text-xl sm:text-2xl md:text-[25px] font-medium text-[#202124] tracking-tight leading-snug mb-2.5"
            >
              Sunucuya bağlanılamıyor
            </h1>

            {/* Error Subtitle */}
            <p 
              id="error-description"
              className="text-sm sm:text-base text-[#5f6368] font-normal leading-relaxed mb-7 max-w-xs sm:max-w-sm"
            >
              Sunucuya bağlanırken bir sorun oluştu. Lütfen tekrar deneyin.
            </p>

            {/* Retry Button */}
            <button
              id="retry-button"
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] min-w-[140px] rounded-md bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
            >
              <span className="text-base font-normal leading-none" aria-hidden="true">↻</span>
              <span>Tekrar dene</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
