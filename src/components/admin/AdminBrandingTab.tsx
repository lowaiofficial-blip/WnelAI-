import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Globe, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Eye, 
  FileCode, 
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';
import { uploadBrandingAsset, DEFAULT_BRANDING_LOGO, DEFAULT_BRANDING_FAVICON } from '../../lib/firebase/firestore';
import { WnelLogo } from '../common/WnelLogo';
import { cn } from '../../lib/utils';

export function AdminBrandingTab() {
  const { 
    logoUrl, 
    faviconUrl, 
    updatedAt, 
    updateLogo, 
    updateFavicon, 
    resetLogo, 
    resetFavicon,
    getBustedLogoUrl,
    getBustedFaviconUrl
  } = useBranding();

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Favicon state
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [faviconSuccess, setFaviconSuccess] = useState<string | null>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Copied toast
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // ---------------- Logo File Selection ----------------
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    setLogoSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Lütfen geçerli bir görsel formatı seçin (PNG, JPG, WEBP veya SVG).');
      return;
    }

    // Check size (max 6MB)
    if (file.size > 6 * 1024 * 1024) {
      setLogoError('Görsel boyutu 6MB\'dan küçük olmalıdır.');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ---------------- Favicon File Selection ----------------
  const handleFaviconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFaviconError(null);
    setFaviconSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check type
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/webp', 'image/svg+xml', 'image/jpeg'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      setFaviconError('Lütfen geçerli bir favicon formatı seçin (PNG, ICO, WEBP veya SVG).');
      return;
    }

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFaviconError('Favicon boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    setFaviconFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFaviconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ---------------- Upload Logo ----------------
  const handleUploadLogo = async () => {
    if (!logoPreview) return;
    setIsUploadingLogo(true);
    setLogoError(null);
    setLogoSuccess(null);

    try {
      // 1. Upload to ImgBB via backend
      const uploadRes = await uploadBrandingAsset({
        image: logoPreview,
        type: 'logo',
        filename: logoFile?.name ? `wnelai-logo-${Date.now()}` : 'wnelai-logo'
      });

      if (!uploadRes.success || !uploadRes.url) {
        setLogoError(uploadRes.error || 'Logo ImgBB servisine yüklenemedi. Lütfen IMGBB_API_KEY ayarını kontrol edin.');
        return;
      }

      // 2. Save new URL to Firestore
      const saveRes = await updateLogo(uploadRes.url);
      if (saveRes.success) {
        setLogoSuccess('Logo başarıyla güncellendi ve tüm WnelAI arayüzlerine yansıtıldı.');
        setLogoFile(null);
        setLogoPreview(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
      } else {
        setLogoError(saveRes.message || 'Logo kaydedilemedi.');
      }
    } catch (err: any) {
      setLogoError(err?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ---------------- Upload Favicon ----------------
  const handleUploadFavicon = async () => {
    if (!faviconPreview) return;
    setIsUploadingFavicon(true);
    setFaviconError(null);
    setFaviconSuccess(null);

    try {
      // 1. Upload to ImgBB via backend
      const uploadRes = await uploadBrandingAsset({
        image: faviconPreview,
        type: 'favicon',
        filename: faviconFile?.name ? `wnelai-favicon-${Date.now()}` : 'wnelai-favicon'
      });

      if (!uploadRes.success || !uploadRes.url) {
        setFaviconError(uploadRes.error || 'Favicon ImgBB servisine yüklenemedi. Lütfen IMGBB_API_KEY ayarını kontrol edin.');
        return;
      }

      // 2. Save new URL to Firestore
      const saveRes = await updateFavicon(uploadRes.url);
      if (saveRes.success) {
        setFaviconSuccess('Favicon başarıyla güncellendi ve tarayıcı başlığına uygulandı.');
        setFaviconFile(null);
        setFaviconPreview(null);
        if (faviconInputRef.current) faviconInputRef.current.value = '';
      } else {
        setFaviconError(saveRes.message || 'Favicon kaydedilemedi.');
      }
    } catch (err: any) {
      setFaviconError(err?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  // ---------------- Reset Actions ----------------
  const handleResetLogo = async () => {
    if (!window.confirm("WnelAI logosunu varsayılan orijinal logoya döndürmek istediğinize emin misiniz?")) return;
    setIsUploadingLogo(true);
    setLogoError(null);
    const res = await resetLogo();
    if (res.success) {
      setLogoSuccess('Logo varsayılana sıfırlandı.');
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      setLogoError(res.message || 'Sıfırlama başarısız.');
    }
    setIsUploadingLogo(false);
  };

  const handleResetFavicon = async () => {
    if (!window.confirm("WnelAI faviconunu varsayılan orijinal haline döndürmek istediğinize emin misiniz?")) return;
    setIsUploadingFavicon(true);
    setFaviconError(null);
    const res = await resetFavicon();
    if (res.success) {
      setFaviconSuccess('Favicon varsayılana sıfırlandı.');
      setFaviconFile(null);
      setFaviconPreview(null);
    } else {
      setFaviconError(res.message || 'Sıfırlama başarısız.');
    }
    setIsUploadingFavicon(false);
  };

  const cancelLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const cancelFaviconSelection = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    setFaviconError(null);
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  };

  const currentLogoSrc = getBustedLogoUrl();
  const currentFaviconSrc = getBustedFaviconUrl();

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-cyan-900/30 border border-blue-500/20 p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dinamik Marka Yönetimi</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              WnelAI Logo & Favicon Varlıkları
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Buradan yüklenen tüm logo ve favicon görselleri ImgBB bulut sunucusunda barındırılır, Firestore üzerinden anlık olarak tüm kullanıcı oturumlarına ve tarayıcı sekmelerine canlı olarak senkronize edilir.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Önbellek Sürümü</span>
            <span className="text-xs font-mono font-semibold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-1 rounded-lg">
              v.{typeof updatedAt === 'number' ? new Date(updatedAt).toLocaleTimeString('tr-TR') : 'Aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns for Logo & Favicon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ========================================================================= */}
        {/* CARD 1: WNELAI LOGO MANAGEMENT */}
        {/* ========================================================================= */}
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">WnelAI Logo</h4>
                  <p className="text-[11px] text-zinc-400">Ana başlık, kenar çubuğu ve sohbet logoları</p>
                </div>
              </div>

              {logoUrl !== DEFAULT_BRANDING_LOGO && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Özel Logo
                </span>
              )}
            </div>

            {/* Current Logo Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Mevcut Aktif Logo:</span>
                <button
                  onClick={() => handleCopy(currentLogoSrc, 'logo')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Logo URL'sini kopyala"
                >
                  {copiedUrl === 'logo' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl === 'logo' ? 'Kopyalandı' : 'URL Kopyala'}</span>
                </button>
              </label>

              <div className="relative p-4 rounded-xl bg-[#09090c] border border-white/10 flex items-center justify-center min-h-[120px] overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Big Logo Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-2 shadow-inner">
                    <img 
                      src={currentLogoSrc} 
                      alt="Current Logo" 
                      className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Brand Display Simulation */}
                  <div className="flex flex-col items-center sm:items-start gap-1">
                    <div className="flex items-center gap-2">
                      <WnelLogo size="sm" withGlow={true} />
                      <span className="text-sm font-bold text-white">WnelAI</span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-semibold">3.8-Max</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 max-w-xs truncate font-mono">
                      {logoUrl}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload New Logo Area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Yeni Logo Yükle <span className="text-zinc-500 font-normal">(PNG, JPG, WEBP - Maks. 6MB)</span>:
              </label>

              <input 
                ref={logoInputRef}
                type="file" 
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                onChange={handleLogoSelect}
                className="hidden"
                id="wnelai-logo-upload"
              />

              {!logoPreview ? (
                <label 
                  htmlFor="wnelai-logo-upload"
                  className="w-full flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-white/15 hover:border-sky-500/50 bg-white/[0.02] hover:bg-sky-500/[0.03] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-sky-500/15 flex items-center justify-center text-zinc-400 group-hover:text-sky-400 mb-2 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    Görsel Seç veya Buraya Sürükle
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    Şeffaf arka planlı (PNG) kare veya yatay logo önerilir
                  </span>
                </label>
              ) : (
                /* Selected File Preview Box */
                <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Yüklenen Yeni Logo Önizlemesi</span>
                    </span>
                    <button
                      onClick={cancelLogoSelection}
                      className="text-[11px] text-zinc-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Seçimi Temizle
                    </button>
                  </div>

                  <div className="flex items-center gap-4 bg-black/60 p-3 rounded-lg border border-white/5">
                    <div className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{logoFile?.name || 'Yeni Logo'}</p>
                      <p className="text-[11px] text-zinc-400">
                        {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Hazır'}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        ✓ Yüklemeye hazır
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error / Success Feedback */}
            {logoError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            {logoSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{logoSuccess}</span>
              </div>
            )}
          </div>

          {/* Action Buttons for Logo */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {logoPreview && (
                <button
                  onClick={cancelLogoSelection}
                  disabled={isUploadingLogo}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Mevcut Logoyu Koru
                </button>
              )}

              {logoUrl !== DEFAULT_BRANDING_LOGO && (
                <button
                  onClick={handleResetLogo}
                  disabled={isUploadingLogo}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Varsayılan orijinal WnelAI logosuna dön"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Varsayılana Sıfırla</span>
                </button>
              )}
            </div>

            <button
              onClick={handleUploadLogo}
              disabled={!logoPreview || isUploadingLogo}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-md cursor-pointer",
                logoPreview && !isUploadingLogo
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-blue-500/25 active:scale-95"
                  : "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
              )}
            >
              {isUploadingLogo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Logoyu Güncelliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Logoyu Güncelle</span>
                </>
              )}
            </button>
          </div>
        </div>


        {/* ========================================================================= */}
        {/* CARD 2: WNELAI FAVICON MANAGEMENT */}
        {/* ========================================================================= */}
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Favicon</h4>
                  <p className="text-[11px] text-zinc-400">Tarayıcı sekmesi ve yer imi simgesi (&lt;link rel="icon"&gt;)</p>
                </div>
              </div>

              {faviconUrl !== DEFAULT_BRANDING_FAVICON && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Özel Favicon
                </span>
              )}
            </div>

            {/* Current Favicon Preview (Simulated Browser Tab) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Mevcut Aktif Favicon (Sekme Önizlemesi):</span>
                <button
                  onClick={() => handleCopy(currentFaviconSrc, 'favicon')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Favicon URL'sini kopyala"
                >
                  {copiedUrl === 'favicon' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl === 'favicon' ? 'Kopyalandı' : 'URL Kopyala'}</span>
                </button>
              </label>

              {/* Simulated Browser Chrome Tab */}
              <div className="p-3 rounded-xl bg-[#09090c] border border-white/10 space-y-2">
                {/* Browser Tab mock */}
                <div className="flex items-center gap-2 bg-[#1a1a22] px-3.5 py-2 rounded-t-lg border-t border-x border-white/10 max-w-xs shadow-sm">
                  <div className="w-4 h-4 rounded-sm shrink-0 overflow-hidden flex items-center justify-center">
                    <img 
                      src={faviconPreview || currentFaviconSrc} 
                      alt="Favicon Tab" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-200 truncate flex-1">
                    WnelAI — Akıllı Asistan
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">✕</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-1 font-mono">
                  <span className="truncate max-w-[280px]">{faviconUrl}</span>
                  <span className="text-zinc-600">32x32 / 64x64</span>
                </div>
              </div>
            </div>

            {/* Upload New Favicon Area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Yeni Favicon Yükle <span className="text-zinc-500 font-normal">(PNG, ICO, WEBP - Maks. 2MB)</span>:
              </label>

              <input 
                ref={faviconInputRef}
                type="file" 
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,image/svg+xml,image/jpeg" 
                onChange={handleFaviconSelect}
                className="hidden"
                id="wnelai-favicon-upload"
              />

              {!faviconPreview ? (
                <label 
                  htmlFor="wnelai-favicon-upload"
                  className="w-full flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/50 bg-white/[0.02] hover:bg-amber-500/[0.03] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-amber-500/15 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 mb-2 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    Favicon Dosyası Seç (.ico, .png, .webp)
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    Kare 1:1 formatında (32x32, 64x64 veya 128x128 piksel) tavsiye edilir
                  </span>
                </label>
              ) : (
                /* Selected Favicon Preview Box */
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Seçilen Yeni Favicon Önizlemesi</span>
                    </span>
                    <button
                      onClick={cancelFaviconSelection}
                      className="text-[11px] text-zinc-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Seçimi Temizle
                    </button>
                  </div>

                  <div className="flex items-center gap-4 bg-black/60 p-3 rounded-lg border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img src={faviconPreview} alt="Favicon Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{faviconFile?.name || 'Yeni Favicon'}</p>
                      <p className="text-[11px] text-zinc-400">
                        {faviconFile ? `${(faviconFile.size / 1024).toFixed(1)} KB` : 'Hazır'}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        ✓ Yüklemeye hazır
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error / Success Feedback */}
            {faviconError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{faviconError}</span>
              </div>
            )}

            {faviconSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{faviconSuccess}</span>
              </div>
            )}
          </div>

          {/* Action Buttons for Favicon */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {faviconPreview && (
                <button
                  onClick={cancelFaviconSelection}
                  disabled={isUploadingFavicon}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Mevcut Favicon'u Koru
                </button>
              )}

              {faviconUrl !== DEFAULT_BRANDING_FAVICON && (
                <button
                  onClick={handleResetFavicon}
                  disabled={isUploadingFavicon}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Varsayılan orijinal WnelAI faviconuna dön"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Varsayılana Sıfırla</span>
                </button>
              )}
            </div>

            <button
              onClick={handleUploadFavicon}
              disabled={!faviconPreview || isUploadingFavicon}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-md cursor-pointer",
                faviconPreview && !isUploadingFavicon
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-amber-500/25 active:scale-95"
                  : "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
              )}
            >
              {isUploadingFavicon ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Favicon Güncelliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Favicon'u Güncelle</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Security and Implementation Details Footer */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Marka varlıkları <strong>Firestore (settings/branding)</strong> ve <strong>ImgBB API</strong> aracılığıyla güvenli şekilde saklanmaktadır.
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
          <span>Önbellek Önleme: ?v=timestamp</span>
          <span>•</span>
          <span>Yalnızca Yetkili Admin</span>
        </div>
      </div>
    </div>
  );
}
