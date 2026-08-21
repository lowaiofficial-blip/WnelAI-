import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Camera, 
  Check, 
  LogOut, 
  Trash2, 
  KeyRound, 
  Loader2, 
  ShieldAlert, 
  Sparkles,
  Volume2,
  Mail,
  AtSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { WnelLogo } from '../common/WnelLogo';
import { GoBadge } from '../common/GoBadge';
import { Rocket } from 'lucide-react';
import { sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'account' | 'notifications' | 'appearance';
  onOpenGoModal?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export function ProfileSettingsModal({ isOpen, onClose, initialTab = 'profile', onOpenGoModal }: ProfileSettingsModalProps) {
  const { user, profile, updateProfileData, signOut, deleteAccount, isGo } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'appearance'>(initialTab);

  // Profile Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Password & Account Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Notification & Appearance Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setPhotoURL(profile.photoURL || user?.photoURL || '');
      setNotificationsEnabled(profile.settings?.notificationsEnabled ?? true);
      setPushEnabled(profile.settings?.pushEnabled ?? false);
      setSoundEffects(profile.settings?.soundEffects ?? true);
      setTheme(profile.settings?.theme ?? 'dark');
      setStatusMessage(null);
    }
  }, [isOpen, profile, user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      });
      showStatus('success', 'Profil bilgileri veritabanına başarıyla kaydedildi.');
    } catch (error: any) {
      showStatus('error', error.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showStatus('error', 'Görsel boyutu 2MB dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoURL(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (newSettings: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfileData({
        settings: {
          notificationsEnabled,
          pushEnabled,
          soundEffects,
          theme,
          ...newSettings
        }
      });
      showStatus('success', 'Tercihleriniz başarıyla kaydedildi.');
    } catch (error: any) {
      showStatus('error', 'Tercihler kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showStatus('success', `Şifre sıfırlama bağlantısı ${user.email} adresine gönderildi.`);
    } catch (error: any) {
      showStatus('error', error.message || 'Sıfırlama e-postası gönderilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword.length < 6) {
      showStatus('error', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showStatus('error', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    setIsSaving(true);
    try {
      // Re-authenticate if current password is provided
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showStatus('success', 'Şifreniz başarıyla değiştirildi.');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showStatus('error', 'Mevcut şifreniz hatalı.');
      } else if (error.code === 'auth/requires-recent-login') {
        showStatus('error', 'Güvenlik nedeniyle şifre değiştirmek için lütfen tekrar giriş yapın.');
      } else {
        showStatus('error', error.message || 'Şifre güncellenemedi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HESABIMI SİL') {
      showStatus('error', 'Onaylamak için lütfen "HESABIMI SİL" yazın.');
      return;
    }
    setIsSaving(true);
    try {
      await deleteAccount();
      onClose();
    } catch (error: any) {
      showStatus('error', error.message || 'Hesap silinemedi. Lütfen tekrar giriş yapıp deneyin.');
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-[#121214] border border-white/10 rounded-2xl md:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#18181b]/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Profil & Ayarlar</h2>
                  <p className="text-xs text-zinc-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/5 bg-[#0e0e10] px-4 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'profile'
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <User className="w-4 h-4" />
                Profil
              </button>
              <button
                onClick={() => { setActiveTab('account'); setStatusMessage(null); }}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'account'
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Lock className="w-4 h-4" />
                Hesap & Güvenlik
              </button>
              <button
                onClick={() => { setActiveTab('notifications'); setStatusMessage(null); }}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'notifications'
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Bell className="w-4 h-4" />
                Bildirimler
              </button>
              <button
                onClick={() => { setActiveTab('appearance'); setStatusMessage(null); }}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'appearance'
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Palette className="w-4 h-4" />
                Görünüm
              </button>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-sm",
                  statusMessage.type === 'success' 
                    ? "bg-green-500/10 border border-green-500/20 text-green-400" 
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                )}
              >
                {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </motion.div>
            )}

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* TAB 1: PROFİL */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Avatar section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#18181b] border-2 border-white/10 flex items-center justify-center shadow-lg">
                        {photoURL ? (
                          <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white uppercase">
                            {displayName?.[0] || user?.email?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-2xl transition-opacity text-white text-xs gap-1 cursor-pointer"
                        title="Fotoğrafı Değiştir"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Değiştir</span>
                      </button>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-sm font-semibold text-white mb-1">Profil Fotoğrafı</h4>
                      <p className="text-xs text-zinc-400 mb-3">Bilgisayarınızdan yükleyin veya hazır avatarlardan seçin.</p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPhotoURL(url)}
                            className={cn(
                              "w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110",
                              photoURL === url ? "border-blue-500 scale-105 ring-2 ring-blue-500/30" : "border-white/10"
                            )}
                          >
                            <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {photoURL && (
                          <button
                            type="button"
                            onClick={() => setPhotoURL('')}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg transition-colors ml-1"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-zinc-500" />
                      Görünen İsim
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      maxLength={80}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <AtSign className="w-4 h-4 text-zinc-500" />
                      Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="kullaniciadi"
                        maxLength={30}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Sadece küçük harf, rakam ve alt çizgi (_) kullanılabilir.</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Hakkımda / Biyografi</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={250}
                      placeholder="Kendiniz hakkında kısa bir bilgi..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm resize-none"
                    />
                    <div className="text-right text-[11px] text-zinc-500 mt-1">
                      {bio.length}/250
                    </div>
                  </div>

                  {/* Plan / Membership Info Card */}
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                    isGo
                      ? "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/10"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                        isGo ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-white/10 border-white/10 text-zinc-300"
                      )}>
                        <Rocket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-medium">Mevcut Üyelik Planı:</span>
                          {isGo ? (
                            <GoBadge size="sm" />
                          ) : (
                            <span className="text-xs bg-white/10 text-zinc-300 font-semibold px-2 py-0.5 rounded-md">
                              WnelAI Free
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          {isGo 
                            ? "🚀 Sınırsız Hızlı Mod, 5x Düşünen Mod, Dosya Yükleme & Özel Rozet aktif."
                            : "⚡ Hızlı mod ve 3 saatte 1 Düşünen mod kullanım hakkı."}
                        </p>
                      </div>
                    </div>

                    {onOpenGoModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGoModal();
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                          isGo
                            ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-md shadow-amber-500/20"
                        )}
                      >
                        {isGo ? "Detayları Gör" : "WnelAI Go'ya Geç 🚀"}
                      </button>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Değişiklikleri Kaydet
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: HESAP & GÜVENLİK */}
              {activeTab === 'account' && (
                <div className="space-y-8">
                  {/* Email info */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-400">Kayıtlı E-posta</div>
                      <div className="text-sm font-medium text-white mt-0.5">{user?.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <Check className="w-3.5 h-3.5" />
                      Doğrulandı
                    </div>
                  </div>

                  {/* Change Password */}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      Şifre Değiştir
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Mevcut Şifre</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Yeni Şifre</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="En az 6 karakter"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Yeni Şifre (Tekrar)</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Tekrar girin"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handlePasswordResetEmail}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Şifremi unuttum? E-posta gönder
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || !newPassword}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-xl transition-all disabled:opacity-50 text-sm"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Şifreyi Güncelle'}
                      </button>
                    </div>
                  </form>

                  <div className="h-px bg-white/5" />

                  {/* Sign Out */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Oturumu Kapat</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Bu cihazdaki açık oturumunuzu sonlandırır.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { signOut(); onClose(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                      <ShieldAlert className="w-4 h-4" />
                      Tehlikeli Bölge
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Hesabınızı sildiğinizde tüm sohbet geçmişiniz, kişisel verileriniz ve ayarlarınız kalıcı olarak silinir. Bu işlem geri alınamaz.
                    </p>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors border border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hesabımı Kalıcı Olarak Sil
                      </button>
                    ) : (
                      <div className="space-y-3 pt-2 bg-black/40 p-4 rounded-xl border border-red-500/30">
                        <p className="text-xs text-red-300 font-medium">
                          Onaylamak için lütfen aşağıdaki kutuya <strong className="text-white">HESABIMI SİL</strong> yazın:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="HESABIMI SİL"
                          className="w-full bg-black/60 border border-red-500/40 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={isSaving || deleteConfirmText !== 'HESABIMI SİL'}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Evet, Hesabımı Sil'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                            className="px-3 py-2 text-xs text-zinc-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BİLDİRİMLER */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Genel Bildirimler</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Uygulama içi güncellemeler ve önemli duyurular.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !notificationsEnabled;
                        setNotificationsEnabled(newVal);
                        handleSaveSettings({ notificationsEnabled: newVal });
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative p-0.5",
                        notificationsEnabled ? "bg-blue-600" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform",
                        notificationsEnabled ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Push Bildirimleri</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Tarayıcı arka plandayken bildirim alın.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !pushEnabled;
                        setPushEnabled(newVal);
                        handleSaveSettings({ pushEnabled: newVal });
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative p-0.5",
                        pushEnabled ? "bg-blue-600" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform",
                        pushEnabled ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Ses Efektleri</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Mesaj gönderildiğinde veya tamamlandığında ses çal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !soundEffects;
                        setSoundEffects(newVal);
                        handleSaveSettings({ soundEffects: newVal });
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative p-0.5",
                        soundEffects ? "bg-blue-600" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform",
                        soundEffects ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GÖRÜNÜM */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Tema Tercihi</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('dark');
                          handleSaveSettings({ theme: 'dark' });
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all",
                          theme === 'dark' 
                            ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10" 
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                        )}
                      >
                        <div className="w-full h-12 bg-[#0a0a0a] rounded-xl border border-white/10 mb-3 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        </div>
                        <div className="font-medium text-sm">Koyu Tema</div>
                        <div className="text-xs text-zinc-500 mt-0.5">WnelAI Dark Edition (Varsayılan)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTheme('light');
                          handleSaveSettings({ theme: 'light' });
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all",
                          theme === 'light' 
                            ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10" 
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                        )}
                      >
                        <div className="w-full h-12 bg-zinc-800 rounded-xl border border-white/20 mb-3 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-blue-400" />
                        </div>
                        <div className="font-medium text-sm">Açık / Yarı-Koyu</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Yüksek kontrast</div>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <WnelLogo size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-white">WnelAI V2.4</div>
                      <div className="text-[11px] text-zinc-500">Tüm arayüz ve logolar kalıcı olarak senkronize edilir.</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
