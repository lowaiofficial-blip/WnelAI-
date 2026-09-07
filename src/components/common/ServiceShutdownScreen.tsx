import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useBranding } from '../../contexts/BrandingContext';

interface ServiceShutdownScreenProps {
  onAdminUnlock?: () => void;
}

/**
 * ServiceShutdownScreen
 * 
 * Official permanent service shutdown screen for WnelAI.
 * Inspired by the clean, modern, high-contrast technology shutdown design reference:
 * - Top brand logo with vibrant geometric 3D blue ribbon 'W' and bold logotype
 * - Center isometric 3D-styled minimalist server rack illustration with disconnect badge and radial sparks
 * - High-contrast display typography: "WnelAI" / "Hizmet Sonlandırıldı"
 * - Clear Turkish explanation: "WnelAI artık aktif olarak hizmet vermemektedir."
 * - Status note: "Sunucuya bağlanılamıyor."
 * - Minimalist bottom accent divider with glowing indicator dot
 */
export function ServiceShutdownScreen({ onAdminUnlock }: ServiceShutdownScreenProps) {
  const { getBustedLogoUrl } = useBranding();
  const logoSrc = getBustedLogoUrl();

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
      id="service-shutdown-screen"
      role="main"
      aria-label="WnelAI Hizmet Sonlandırma Bildirimi"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFFFFF] flex flex-col justify-between items-center px-6 py-10 sm:py-14 select-none overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Background Soft Glow Effect */}
      <div 
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60"
        aria-hidden="true"
      >
        <div className="w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full bg-gradient-to-tr from-sky-100/50 via-blue-50/30 to-transparent blur-3xl" />
      </div>

      {/* Top Header: WnelAI Logo */}
      <motion.header
        id="shutdown-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex items-center justify-center gap-3 pt-2 sm:pt-4"
      >
        {/* Stylized Vibrant Blue 'W' Logo matching reference image */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 120 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,102,255,0.28)]"
            aria-hidden="true"
          >
            <defs>
              {/* Vibrant Electric Blue Gradient */}
              <linearGradient id="wnel-logo-blue" x1="10%" y1="10%" x2="90%" y2="90%">
                <stop offset="0%" stopColor="#2575FC" />
                <stop offset="40%" stopColor="#0066FF" />
                <stop offset="100%" stopColor="#0052D4" />
              </linearGradient>

              {/* Glossy Top Highlight */}
              <linearGradient id="wnel-logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>

              {/* Depth Shadow Layer */}
              <linearGradient id="wnel-logo-shadow" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0040C1" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>
            </defs>

            {/* Base Smooth Symmetric 'W' Ribbon */}
            <path
              d="M 22 26 L 42 74 L 60 38 L 78 74 L 98 26"
              stroke="url(#wnel-logo-blue)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner Highlights for 3D Volume & Sleekness */}
            {/* Left Top Pill Highlight */}
            <circle cx="22" cy="26" r="7" fill="#60A5FA" opacity="0.4" />
            
            {/* Right Top Pill Highlight */}
            <circle cx="98" cy="26" r="7" fill="#60A5FA" opacity="0.4" />

            {/* Center Apex Highlight */}
            <path
              d="M 54 48 L 60 38 L 66 48"
              stroke="url(#wnel-logo-glow)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Logotype text */}
        <div className="flex items-center text-3xl sm:text-4xl font-extrabold tracking-tight select-none">
          <span className="text-[#0B0F19]">Wnel</span>
          <span className="text-[#0066FF]">AI</span>
        </div>
      </motion.header>

      {/* Center Section: 3D Server Illustration & Core Message */}
      <motion.div
        id="shutdown-content"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full mx-auto my-auto py-6"
      >
        {/* Center 3D Server Rack Illustration */}
        <div 
          id="server-illustration-container"
          className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center mb-6 sm:mb-8"
        >
          <svg
            viewBox="0 0 280 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden="true"
          >
            <defs>
              {/* Server Module Gradients */}
              <linearGradient id="server-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>

              <linearGradient id="server-side-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>

              <linearGradient id="server-dark-slot" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>

              {/* Disconnect Badge Gradients */}
              <linearGradient id="badge-disc-grad" x1="15%" y1="15%" x2="85%" y2="85%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              <linearGradient id="badge-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Soft Drop Shadow Filters */}
              <filter id="server-shadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0F172A" floodOpacity="0.12" />
              </filter>

              <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.22" />
              </filter>
            </defs>

            {/* Ambient Base Shadow */}
            <ellipse cx="140" cy="225" rx="85" ry="14" fill="#0F172A" fillOpacity="0.08" filter="blur(6px)" />
            <ellipse cx="140" cy="223" rx="60" ry="8" fill="#0284C7" fillOpacity="0.1" filter="blur(4px)" />

            {/* Radiating Electric Blue Spark Ticks */}
            {/* Top-Left Rays */}
            <line x1="86" y1="96" x2="74" y2="86" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="82" y1="110" x2="68" y2="110" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="86" y1="124" x2="74" y2="134" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />

            {/* Right Rays */}
            <line x1="202" y1="96" x2="214" y2="86" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="208" y1="110" x2="222" y2="110" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="202" y1="124" x2="214" y2="134" stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" />

            {/* 3D Server Blade Stack Container */}
            <g filter="url(#server-shadow)">
              {/* --- Server Unit 1 (Top) --- */}
              <g>
                <rect x="92" y="78" width="102" height="28" rx="7" fill="url(#server-top-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
                {/* Indicator Dots */}
                <circle cx="104" cy="92" r="2.8" fill="url(#server-dark-slot)" />
                <circle cx="113" cy="92" r="2.8" fill="url(#server-dark-slot)" />
                {/* Horizontal Vent / Slot */}
                <rect x="124" y="90" width="46" height="4" rx="2" fill="url(#server-dark-slot)" opacity="0.6" />
                {/* Subtle Top Highlight */}
                <path d="M 96 80 L 190 80" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
              </g>

              {/* --- Server Unit 2 (Middle) --- */}
              <g>
                <rect x="92" y="112" width="102" height="28" rx="7" fill="url(#server-top-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
                {/* Indicator Dots */}
                <circle cx="104" cy="126" r="2.8" fill="url(#server-dark-slot)" />
                <circle cx="113" cy="126" r="2.8" fill="url(#server-dark-slot)" />
                {/* Horizontal Vent / Slot */}
                <rect x="124" y="124" width="46" height="4" rx="2" fill="url(#server-dark-slot)" opacity="0.6" />
                {/* Subtle Top Highlight */}
                <path d="M 96 114 L 190 114" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
              </g>

              {/* --- Server Unit 3 (Bottom) --- */}
              <g>
                <rect x="92" y="146" width="102" height="28" rx="7" fill="url(#server-top-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
                {/* Indicator Dots */}
                <circle cx="104" cy="160" r="2.8" fill="url(#server-dark-slot)" />
                <circle cx="113" cy="160" r="2.8" fill="url(#server-dark-slot)" />
                {/* Horizontal Vent / Slot */}
                <rect x="124" y="158" width="46" height="4" rx="2" fill="url(#server-dark-slot)" opacity="0.6" />
                {/* Subtle Top Highlight */}
                <path d="M 96 148 L 190 148" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
              </g>
            </g>

            {/* --- Metallic Circular Disconnect / Offline Shield Badge --- */}
            <g filter="url(#badge-shadow)">
              {/* Outer Badge Rim */}
              <circle cx="178" cy="154" r="30" fill="url(#badge-rim-grad)" stroke="#E2E8F0" strokeWidth="2.5" />
              {/* Inner Disc Core */}
              <circle cx="178" cy="154" r="27.5" fill="url(#badge-disc-grad)" />
              {/* Inner Rim Light */}
              <circle cx="178" cy="154" r="25.5" stroke="#64748B" strokeWidth="1" fill="none" opacity="0.6" />

              {/* Cutout Slashed Power / Disconnect Symbol in White */}
              <path
                d="M 166 142 C 166 142, 188 142, 191 154 C 193 162, 184 169, 175 169 C 166 169, 164 160, 166 142 Z"
                fill="#FFFFFF"
                opacity="0.95"
              />
              {/* Diagonal Slash Cutout Bar */}
              <line
                x1="163"
                y1="138"
                x2="193"
                y2="170"
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="163"
                y1="138"
                x2="193"
                y2="170"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Primary Title: WnelAI Hizmet Sonlandırıldı */}
        <h1 
          id="shutdown-title"
          className="text-3xl sm:text-4xl md:text-[44px] font-black text-[#0B0F19] tracking-tight leading-[1.15] mb-4 sm:mb-5 font-sans"
        >
          <span className="block text-[#0B0F19]">WnelAI</span>
          <span className="block text-[#0B0F19]">Hizmet Sonlandırıldı</span>
        </h1>

        {/* Subtitle Description */}
        <p 
          id="shutdown-description"
          className="text-base sm:text-lg md:text-xl font-medium text-[#475569] leading-relaxed max-w-sm sm:max-w-md mx-auto mb-2"
        >
          WnelAI artık aktif olarak hizmet vermemektedir.
        </p>

        {/* Status Caption */}
        <p 
          id="shutdown-status-caption"
          className="text-xs sm:text-sm font-normal text-[#94A3B8] tracking-normal"
        >
          Sunucuya bağlanılamıyor.
        </p>
      </motion.div>

      {/* Bottom Footer Accent: Minimalist Hairline Divider with Blue Indicator Dot */}
      <motion.footer
        id="shutdown-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative z-10 flex items-center justify-center gap-3 pb-2 select-none"
        aria-hidden="true"
      >
        <div className="w-12 sm:w-16 h-[1.5px] bg-[#E2E8F0] rounded-full" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF] ring-4 ring-[#0066FF]/15 shadow-sm" />
        <div className="w-12 sm:w-16 h-[1.5px] bg-[#E2E8F0] rounded-full" />
      </motion.footer>
    </main>
  );
}

export { ServiceShutdownScreen as ServerConnectionScreen };
