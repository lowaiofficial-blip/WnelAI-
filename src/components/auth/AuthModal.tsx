import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';
import { requestEmailVerificationCode } from '../../lib/firebase/firestore';
import { cn } from '../../lib/utils';
import { WnelLogo } from '../common/WnelLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccess(null);
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Request 4-digit verification code sent to admin (golabsdestek@outlook.com)
        await requestEmailVerificationCode({
          userId: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: email.split('@')[0],
          username: email.split('@')[0],
        });
        onClose();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Bu e-posta adresi zaten kullanılıyor.');
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') setError('E-posta veya şifre hatalı.');
      else if (err.code === 'auth/user-not-found') setError('Kullanıcı bulunamadı.');
      else if (err.code === 'auth/operation-not-allowed') setError('E-posta ile giriş kapalı. Firebase Console > Authentication bölümünden "Email/Password" seçeneğini aktif edin.');
      else setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <div className="flex flex-col items-center gap-3 mb-8">
                  <WnelLogo size="xl" withGlow={true} />
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">WnelAI</h2>
                    <p className="text-xs text-blue-400 font-medium tracking-widest uppercase mt-0.5">AI Assistant</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-medium text-white mb-2">
                    {mode === 'login' ? 'Tekrar hoş geldiniz' : mode === 'register' ? 'Hesap oluşturun' : 'Şifrenizi sıfırlayın'}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {mode === 'login' ? 'Devam etmek için giriş yapın.' : mode === 'register' ? 'Yeni bir hesap açarak yapay zekanın gücünü keşfedin.' : 'E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">E-posta adresi</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  {mode !== 'reset' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
                        <label className="block text-sm font-medium text-zinc-300">Şifre</label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={() => setMode('reset')}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Şifremi unuttum
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        {mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Kayıt ol' : 'Bağlantı gönder'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-zinc-400">
                    {mode === 'login' ? 'Hesabınız yok mu? ' : mode === 'register' ? 'Zaten hesabınız var mı? ' : 'Giriş ekranına dön. '}
                    <button 
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
