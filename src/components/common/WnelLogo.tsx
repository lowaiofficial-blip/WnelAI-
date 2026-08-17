import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const WNEL_LOGO_URL = '/logo.png?v=8';

interface WnelLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  withGlow?: boolean;
  showText?: boolean;
  textClassName?: string;
  alt?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  custom: ''
};

export function WnelLogo({
  className = '',
  size = 'md',
  withGlow = true,
  showText = false,
  textClassName = '',
  alt = 'WnelAI Logo'
}: WnelLogoProps) {
  const [hasError, setHasError] = useState(false);

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0 select-none", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden shrink-0",
        containerSize,
        withGlow && "filter drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
      )}>
        {!hasError ? (
          <img
            src={WNEL_LOGO_URL}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain pointer-events-none"
            loading="eager"
          />
        ) : (
          /* High-fidelity Vector Fallback Emblem (Infinity + Nodes) if image fails */
          <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center p-1 shadow-inner">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white"
            >
              {/* Infinity loop with nodes */}
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
        <span className={cn("text-xl font-semibold tracking-tight text-white flex items-center gap-1.5", textClassName)}>
          WnelAI
        </span>
      )}
    </div>
  );
}
