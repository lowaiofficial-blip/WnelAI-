import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';

export const WNEL_LOGO_URL = '/logo.png?v=8';

interface WnelLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  withGlow?: boolean;
  showText?: boolean;
  showBadge?: boolean;
  textClassName?: string;
  alt?: string;
  customSrc?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-11 h-11',
  xl: 'w-16 h-16',
  custom: ''
};

export function WnelLogo({
  className = '',
  size = 'md',
  withGlow = true,
  showText = false,
  showBadge = false,
  textClassName = '',
  alt = 'WnelAI Logo',
  customSrc
}: WnelLogoProps) {
  const { getBustedLogoUrl } = useBranding();
  const [hasError, setHasError] = useState(false);
  const activeLogoSrc = customSrc || getBustedLogoUrl();

  // Reset error when logo source changes
  useEffect(() => {
    setHasError(false);
  }, [activeLogoSrc]);

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0 select-none", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden shrink-0 transition-transform duration-300",
        containerSize,
        withGlow && "filter drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]"
      )}>
        {!hasError ? (
          <img
            key={activeLogoSrc}
            src={activeLogoSrc}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain pointer-events-none"
            loading="eager"
          />
        ) : (
          /* High-fidelity Vector Fallback Emblem (Infinity + Nodes) */
          <div className="w-full h-full bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 rounded-xl flex items-center justify-center p-1 shadow-inner border border-white/20">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white"
            >
              <circle cx="50" cy="18" r="7" fill="#ffffff" />
              <circle cx="28" cy="28" r="5" fill="#ffffff" />
              <circle cx="72" cy="28" r="5" fill="#ffffff" />
              <circle cx="50" cy="85" r="6" fill="#ffffff" />
              <path
                d="M28 28 C 38 18, 62 18, 72 28 M50 18 L50 38 M20 80 C 40 90, 60 90, 80 80"
                stroke="#ffffff"
                strokeWidth="2.5"
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

      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={cn("text-lg font-bold tracking-tight text-white flex items-center gap-1", textClassName)}>
            WnelAI
          </span>
          {showBadge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md">
              <Sparkles className="w-2.5 h-2.5" />
              <span>✦</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

