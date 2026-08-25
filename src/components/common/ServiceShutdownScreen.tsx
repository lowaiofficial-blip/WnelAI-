import React, { useState, useEffect } from 'react';
import { useBranding } from '../../contexts/BrandingContext';

interface ServiceShutdownScreenProps {
  onAdminUnlock?: () => void;
}

export function ServiceShutdownScreen({ onAdminUnlock }: ServiceShutdownScreenProps) {
  const { logoUrl, updatedAt, getBustedLogoUrl } = useBranding();
  const logoSrc = getBustedLogoUrl();
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Re-enable image loading if logo source updates from Firestore in real-time
  useEffect(() => {
    setLogoLoadError(false);
  }, [logoSrc, logoUrl, updatedAt]);

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
      id="service-shutdown-page"
      role="main"
      aria-label="WnelAI Hizmet Sonlandırma Bildirimi"
      className="min-h-screen w-full bg-[#000000] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.08),rgba(0,0,0,0))] text-zinc-100 flex flex-col justify-between items-center px-6 py-12 sm:py-16 md:py-24 font-sans selection:bg-sky-500/25 selection:text-white"
    >
      {/* Top Spacer */}
      <div className="w-full max-w-xl" aria-hidden="true" />

      {/* Center Notice Content */}
      <div className="w-full max-w-xl flex flex-col items-center text-center">
        {/* Dynamic Centered WnelAI Logo */}
        <div 
          id="shutdown-logo-container" 
          className="mb-8 sm:mb-10 flex items-center justify-center select-none"
        >
          {logoSrc && !logoLoadError ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-2.5 sm:p-3 shadow-2xl backdrop-blur-sm">
              <img
                key={logoSrc}
                src={logoSrc}
                alt="WnelAI"
                onError={() => setLogoLoadError(true)}
                className="w-full h-full object-contain pointer-events-none"
                loading="eager"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center p-3 text-white">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                aria-hidden="true"
              >
                <circle cx="50" cy="18" r="7" fill="#ffffff" />
                <circle cx="28" cy="28" r="5" fill="#ffffff" />
                <circle cx="72" cy="28" r="5" fill="#ffffff" />
                <circle cx="50" cy="85" r="6" fill="#ffffff" />
                <path
                  d="M28 28 C 38 18, 62 18, 72 28 M50 18 L50 38 M20 80 C 40 90, 60 90, 80 80"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M22 46 C 14 38, 14 62, 28 72 C 40 80, 48 55, 50 48 C 52 55, 60 80, 72 72 C 86 62, 86 38, 78 46 C 70 54, 58 70, 50 60 C 42 70, 30 54, 22 46 Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Main Heading */}
        <h1 
          id="shutdown-title"
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight mb-4"
        >
          WnelAI hizmeti sonlandırıldı
        </h1>

        {/* Primary Explanation */}
        <p 
          id="shutdown-description-primary"
          className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-lg mb-3"
        >
          WnelAI hizmeti artık kullanıma açık değildir.
        </p>

        {/* Gratitude Statement */}
        <p 
          id="shutdown-description-secondary"
          className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-lg"
        >
          Bugüne kadar WnelAI'yi kullanan herkese teşekkür ederiz.
        </p>
      </div>

      {/* Footer Section */}
      <footer 
        id="shutdown-footer"
        className="w-full max-w-xl text-center pt-12 sm:pt-16 flex flex-col items-center gap-1.5 select-none"
      >
        <span className="text-xs sm:text-sm font-medium text-zinc-400 tracking-normal">
          Go Labs
        </span>
        <span className="text-xs text-zinc-500 font-normal">
          © 2026 Go Labs
        </span>
      </footer>
    </main>
  );
}
