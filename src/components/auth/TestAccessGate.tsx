import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { WnelLogo } from '../common/WnelLogo';

interface TestAccessGateProps {
  onSuccess: () => void;
}

export function TestAccessGate({ onSuccess }: TestAccessGateProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-test-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('wnelai_test_access_granted', 'true');
        onSuccess();
      } else {
        setError('❌ Erişim kodu hatalı.');
      }
    } catch (err) {
      setError('❌ Doğrulama sırasında bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c] text-white select-none">
      {/* Background subtle atmospheric gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#121216]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center"
      >
        {/* Top Badges & Logo */}
        <div className="relative mb-5 flex flex-col items-center">
          <div className="relative mb-3">
            <WnelLogo size="xl" withGlow={true} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#18181c] border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          WnelAI Test Aşamasında
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm">
          «WnelAI şu anda sınırlı test erişimindedir. Kullanabilmek için test erişim kodunu girin.»
        </p>

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Test erişim kodu"
              autoFocus
              className="w-full bg-[#1a1a20] border border-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-zinc-600 rounded-2xl py-3.5 px-4 text-center text-base sm:text-lg font-mono tracking-widest outline-none transition-all"
            />
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium py-1"
              >
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!code.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold py-3.5 px-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>WnelAI'yi Kullan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
