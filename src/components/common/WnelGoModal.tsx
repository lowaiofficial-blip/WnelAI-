import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Minus, Sparkles, Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface WnelGoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimVipPrompt?: () => void;
}

export function WnelGoModal({ isOpen, onClose, onClaimVipPrompt }: WnelGoModalProps) {
  const { isGo } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'go' | 'plus'>('go');

  if (!isOpen) return null;

  const features = [
    {
      name: 'Sınırsız yazılı sohbet',
      free: true,
      go: true,
      plus: true,
    },
    {
      name: 'Düşünen Mod ile daha fazla mesaj',
      free: false,
      go: true,
      plus: true,
    },
    {
      name: 'Dosya ve görsel yükleme',
      free: false,
      go: true,
      plus: true,
    },
    {
      name: 'Daha hızlı yanıt ve öncelikli işlem',
      free: false,
      go: true,
      plus: true,
    },
    {
      name: 'Daha uzun bağlam ve bellek',
      free: false,
      go: true,
      plus: true,
    },
    {
      name: 'Özel WnelAI Go Profil Rozeti',
      free: false,
      go: true,
      plus: true,
    },
  ];

  const handleApply = () => {
    onClose();
    if (onClaimVipPrompt) {
      onClaimVipPrompt();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0b0b0e] border border-white/10 rounded-[32px] w-full max-w-[440px] shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh] text-white select-none"
      >
        {/* Top Bar with Back Button */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
            aria-label="Geri"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isGo && (
            <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aktif Plan: Go</span>
            </div>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="px-5 sm:px-6 pb-6 overflow-y-auto space-y-6 scrollbar-none">
          {/* Header Title */}
          <div className="text-left pt-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>WnelAI</span>
              <span className="text-[#5b9dfd]">Go</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-2 font-normal">
              Genişletilmiş erişimle sohbet etmeye devam edin
            </p>
          </div>

          {/* Segmented Control Pill (Go / Plus) */}
          <div className="bg-[#17171d] p-1 rounded-2xl flex items-center border border-white/5">
            <button
              onClick={() => setSelectedTab('go')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center",
                selectedTab === 'go'
                  ? "bg-[#25252e] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Go
            </button>
            <button
              onClick={() => setSelectedTab('plus')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center",
                selectedTab === 'plus'
                  ? "bg-[#25252e] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Plus
            </button>
          </div>

          {/* Features Comparison Card */}
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 sm:p-5">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_64px_64px] items-center text-xs font-semibold pb-3.5 border-b border-white/5">
              <div className="text-zinc-400">Özellikler</div>
              <div className="text-center text-zinc-400">Ücretsiz</div>
              <div className="text-center text-[#5b9dfd] font-bold">
                {selectedTab === 'go' ? 'Go' : 'Plus'}
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/5">
              {features.map((item, idx) => {
                const targetVal = selectedTab === 'go' ? item.go : item.plus;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_64px_64px] items-center py-3 text-xs sm:text-[13px] leading-snug"
                  >
                    <div className="text-zinc-200 pr-2 font-normal">
                      {item.name}
                    </div>

                    {/* Ücretsiz Column */}
                    <div className="flex items-center justify-center text-zinc-400">
                      {item.free ? (
                        <Check className="w-4 h-4 text-zinc-200 stroke-[2.5]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                    </div>

                    {/* Go/Plus Column */}
                    <div className="flex items-center justify-center text-[#5b9dfd]">
                      {targetVal ? (
                        <Check className="w-4 h-4 text-[#5b9dfd] stroke-[2.5]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="space-y-3 pt-2">
            {/* Main Action Button */}
            <button
              onClick={handleApply}
              className="w-full py-4 px-6 rounded-full bg-white hover:bg-zinc-100 active:scale-[0.99] text-black font-bold text-base transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4 text-black" />
              <span>{isGo ? "VIP Başvuru Durumunu Gör" : "WnelAI Go'ya Başvur"}</span>
            </button>

            {/* Application Note */}
            <p className="text-[11px] text-zinc-500 text-center leading-relaxed px-2">
              Sohbet alanında <span className="text-zinc-300 font-mono">/claimvip</span> komutunu göndererek WnelAI Go üyeliğine hemen başvurabilirsiniz.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
