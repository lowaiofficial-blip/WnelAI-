import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Mail, 
  Clock, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { WnelLogo } from '../common/WnelLogo';
import { useAuth } from '../../contexts/AuthContext';
import { requestEmailVerificationCode, verifyEmailCode, updateUserProfile } from '../../lib/firebase/firestore';

interface EmailVerificationGateProps {
  onVerified?: () => void;
}

export function EmailVerificationGate({ onVerified }: EmailVerificationGateProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();

  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  
  // 10 minutes timer (600 seconds)
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [initialSent, setInitialSent] = useState<boolean>(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Request initial verification code on mount if not yet requested
  useEffect(() => {
    if (user && !initialSent) {
      setInitialSent(true);
      handleRequestCode(true);
    }
  }, [user, initialSent]);

  // Main countdown timer (10 mins)
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setError('Doğrulama kodunun 10 dakikalık süresi doldu. Lütfen yeni bir kod isteyin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first empty input
  useEffect(() => {
    const firstEmptyIndex = pin.findIndex(d => d === '');
    if (firstEmptyIndex !== -1 && inputRefs[firstEmptyIndex]?.current) {
      inputRefs[firstEmptyIndex].current?.focus();
    }
  }, []);

  const handleRequestCode = async (isAuto = false) => {
    if (!user) return;
    if (!isAuto && resendCooldown > 0) return;

    setError(null);
    setSuccess(null);
    if (!isAuto) setResending(true);

    try {
      const res = await requestEmailVerificationCode({
        userId: user.uid,
        email: user.email || '',
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0],
        username: profile?.username || user.email?.split('@')[0],
      });

      if (res.success) {
        setSecondsLeft(600); // 10 minutes reset
        setResendCooldown(30); // 30s cooldown before next resend
        setRemainingAttempts(5);
        setPin(['', '', '', '']);
        if (!isAuto) {
          setSuccess('Yeni doğrulama kodu oluşturuldu ve admin destek birimine iletildi.');
        }
        setTimeout(() => {
          inputRefs[0]?.current?.focus();
        }, 100);
      } else {
        setError(res.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (err: any) {
      setError(err?.message || 'Sunucu ile iletişim kurulamadı.');
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digit 0-9
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newPin = [...pin];
      newPin[index] = '';
      setPin(newPin);
      return;
    }

    const digit = cleaned.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError(null);

    // Auto advance to next input
    if (index < 3 && digit) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Auto submit if all 4 digits entered
    const completeCode = newPin.join('');
    if (completeCode.length === 4 && !newPin.includes('')) {
      handleVerify(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs[index - 1]?.current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 4).split('');
    const newPin = ['', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 4) newPin[i] = d;
    });
    setPin(newPin);
    setError(null);

    const focusIdx = Math.min(digits.length, 3);
    inputRefs[focusIdx]?.current?.focus();

    if (digits.length === 4) {
      handleVerify(newPin.join(''));
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    if (!user) return;
    const fullCode = codeToVerify || pin.join('');

    if (fullCode.length !== 4) {
      setError('Lütfen 4 haneli doğrulama kodunu eksiksiz girin.');
      return;
    }

    if (secondsLeft <= 0) {
      setError('Doğrulama kodunun 10 dakikalık süresi doldu. Lütfen yeni bir kod isteyin.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await verifyEmailCode({
        userId: user.uid,
        code: fullCode,
      });

      if (res.success) {
        setSuccess('Doğrulama başarılı! Hesabınız onaylandı.');
        
        // Update user profile in Firestore so real-time listener unblocks instantly
        await updateUserProfile(user.uid, {
          isEmailVerified: true
        });

        await refreshProfile();
        if (onVerified) onVerified();
      } else {
        setError(res.message || 'Hatalı doğrulama kodu.');
        if (typeof res.remainingAttempts === 'number') {
          setRemainingAttempts(res.remainingAttempts);
          if (res.remainingAttempts <= 0) {
            setPin(['', '', '', '']);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Doğrulama sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[75vh] px-4 py-8 select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#121217]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center gap-3 mb-6 relative">
          <WnelLogo size="xl" withGlow={true} />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>WnelAI Verification</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              E-posta Doğrulaması
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
              WnelAI özelliklerini kullanabilmek için 4 haneli güvenlik kodunu girin.
            </p>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 mb-6 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[11px] text-zinc-400 font-medium">Hesap:</div>
              <div className="text-zinc-200 font-semibold truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Farklı hesapla giriş yap"
            className="flex items-center gap-1 text-zinc-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-[11px] font-medium shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-300 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-300 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4-Box PIN Input */}
        <div className="mb-6">
          <label className="block text-center text-xs font-medium text-zinc-400 mb-3 tracking-wide">
            4 HANELİ DOĞRULAMA KODU
          </label>

          <div className="flex items-center justify-center gap-3 sm:gap-4" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={loading || remainingAttempts <= 0 || secondsLeft <= 0}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-13 h-15 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-2xl bg-white/[0.05] border transition-all outline-none font-mono selection:bg-transparent ${
                  digit 
                    ? 'border-blue-500 text-white shadow-lg shadow-blue-500/20 bg-blue-500/5' 
                    : 'border-white/10 text-zinc-300 focus:border-blue-400 focus:bg-white/10'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                placeholder="•"
              />
            ))}
          </div>

          {/* Timer and Attempts Indicator */}
          <div className="flex items-center justify-between mt-4 px-1 text-xs">
            <div className={`flex items-center gap-1.5 font-mono font-medium ${
              secondsLeft < 120 ? 'text-amber-400' : secondsLeft === 0 ? 'text-red-400' : 'text-zinc-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(secondsLeft)}</span>
              {secondsLeft === 0 && <span className="text-red-400 font-sans">(Süre doldu)</span>}
            </div>

            <div className="text-zinc-400">
              Kalan hak: <strong className={remainingAttempts <= 2 ? 'text-red-400' : 'text-zinc-200'}>{remainingAttempts}</strong>/5
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleVerify()}
            disabled={loading || pin.join('').length !== 4 || secondsLeft <= 0 || remainingAttempts <= 0}
            className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-semibold py-3.5 px-5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Kodu Doğrula</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>

          <button
            onClick={() => handleRequestCode(false)}
            disabled={resending || resendCooldown > 0}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-zinc-300 hover:text-white font-medium py-3 px-5 rounded-2xl transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {resending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Kod Gönderiliyor...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0 
                    ? `Yeni Kod İste (${resendCooldown}s)` 
                    : 'Yeni Kod İste'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Security & Admin Support Notice */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Güvenlik gereği doğrulama kodu sistem tarafından oluşturulur ve yetkili admin destek adresi üzerinden onaylanır. Kod 10 dakika geçerlidir.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
