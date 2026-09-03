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
  const [isDialogDismissed, setIsDialogDismissed] = useState(false);

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
        setIsDialogDismissed(false);
        setStage('error');
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    setIsDialogDismissed(false);
    setStage('connecting');
  }, []);

  // Handle cancel button click (closes dialog without resetting connection/error state)
  const handleCancel = useCallback(() => {
    setIsDialogDismissed(true);
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

        {/* Stage 2: Connecting Spinner (5 seconds) - Matched to classic Google splash screenshot */}
        {stage === 'connecting' && (
          <motion.div
            key="connecting-stage"
            id="connecting-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col justify-between items-center py-12 px-6 select-none"
          >
            {/* Top spacing placeholder */}
            <div className="h-6 w-full" aria-hidden="true" />

            {/* Center: WnelAI Logo */}
            <div 
              id="loading-brand-logo"
              className="flex flex-col items-center justify-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center p-1">
                {logoSrc && !logoLoadError ? (
                  <img
                    src={logoSrc}
                    alt="WnelAI"
                    onError={() => setLogoLoadError(true)}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#EA4335] text-white flex items-center justify-center shadow-sm">
                    <svg
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-14 h-14 text-white"
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
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Minimalist Spinner + Go Labs */}
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
              {/* Minimal Synchronizing / Circular Spinner */}
              <div 
                id="connecting-spinner"
                className="w-5 h-5 sm:w-6 sm:h-6 border-[2px] border-[#dadce0] border-t-[#5f6368] rounded-full animate-spin mb-3"
                role="status"
                aria-label="Yükleniyor"
              />

              {/* Go Labs Bottom Brand Text */}
              <span 
                id="go-labs-label"
                className="text-xl sm:text-2xl md:text-[26px] font-medium tracking-normal text-[#9aa0a6] select-none font-sans"
              >
                Go Labs
              </span>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Connection Error Dialog (Appears after 5 seconds) */}
        {stage === 'error' && !isDialogDismissed && (
          <motion.div
            key="error-stage-dialog"
            id="error-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10"
          >
            {/* Classic System Error Dialog Card */}
            <motion.div
              id="system-error-dialog"
              role="alertdialog"
              aria-labelledby="dialog-error-title"
              aria-describedby="dialog-error-desc"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#FFFFFF] rounded-lg shadow-md border border-[#dadce0] w-full max-w-[320px] sm:max-w-[340px] pt-5 pb-4 px-6 select-none"
            >
              {/* Dialog Title */}
              <h2
                id="dialog-error-title"
                className="text-base sm:text-[17px] font-medium text-[#202124] tracking-tight mb-2 leading-snug"
              >
                Sunucuya bağlanılamıyor
              </h2>

              {/* Dialog Description */}
              <p
                id="dialog-error-desc"
                className="text-xs sm:text-[13px] text-[#5f6368] font-normal leading-relaxed mb-6"
              >
                Sunucuya şu anda erişilemiyor.
              </p>

              {/* Action Buttons: İptal / Yeniden dene */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  id="dialog-cancel-btn"
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 min-h-[36px] rounded text-xs sm:text-[13px] font-medium text-[#5f6368] hover:bg-[#f1f3f4] active:bg-[#e8eaed] transition-colors cursor-pointer focus:outline-none"
                >
                  İptal
                </button>
                <button
                  id="dialog-retry-btn"
                  type="button"
                  onClick={handleRetry}
                  className="px-3.5 py-1.5 min-h-[36px] rounded text-xs sm:text-[13px] font-medium text-[#1a73e8] hover:bg-[#1a73e8]/10 active:bg-[#1a73e8]/20 transition-colors cursor-pointer focus:outline-none"
                >
                  Yeniden dene
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
