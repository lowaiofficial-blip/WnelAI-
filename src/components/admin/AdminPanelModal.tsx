import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Activity, 
  Search, 
  Ban, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Mail, 
  User as UserIcon, 
  Lock, 
  Layers, 
  ArrowLeft, 
  Copy, 
  Check, 
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Hash,
  Info,
  Rocket,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { UserProfile, VipClaim } from '../../types';
import { 
  getAllUsersForAdmin, 
  banUser, 
  unbanUser, 
  deleteUserAndData, 
  getUserChatLogsForAdmin, 
  getAdminStats,
  getAllVipClaimsForAdmin,
  approveVipClaim,
  rejectVipClaim,
  setUserPlan,
  Chat,
  ChatMessage
} from '../../lib/firebase/firestore';
import { WnelLogo } from '../common/WnelLogo';
import { GoBadge } from '../common/GoBadge';
import { getLocalFormattedTime } from '../../lib/thinkingCooldown';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const { user, isAdmin } = useAuth();
  
  // Navigation Tabs
  const [adminTab, setAdminTab] = useState<'users' | 'vip_claims'>('users');

  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vipClaims, setVipClaims] = useState<VipClaim[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalChats: number; totalMessages: number; onlineUsers: number }>({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    onlineUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'banned' | 'admins' | 'go'>('all');

  // Selected User for Detail View
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Selected User for Chat Logs
  const [logUser, setLogUser] = useState<UserProfile | null>(null);
  const [userChatLogs, setUserChatLogs] = useState<Array<Chat & { messageCount?: number; messages?: ChatMessage[] }>>([]);
  const [selectedChatLog, setSelectedChatLog] = useState<(Chat & { messages?: ChatMessage[] }) | null>(null);
  const [chatLogSearch, setChatLogSearch] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Ban Dialog state
  const [banTarget, setBanTarget] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('Topluluk kurallarına aykırı davranış');
  const [isBanning, setIsBanning] = useState(false);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action in progress state (e.g. approve claim)
  const [actionClaimId, setActionClaimId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedStats, fetchedClaims] = await Promise.all([
        getAllUsersForAdmin(),
        getAdminStats(),
        getAllVipClaimsForAdmin()
      ]);
      setUsers(fetchedUsers);
      setStats(fetchedStats);
      setVipClaims(fetchedClaims);
    } catch (error: any) {
      console.error("Admin load data error:", error);
      showNotification('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin]);

  // Is User Online Helper (< 5 mins)
  const isUserOnline = (u: UserProfile) => {
    if (!u.lastSeenAt) return false;
    const time = u.lastSeenAt.toMillis ? u.lastSeenAt.toMillis() : new Date(u.lastSeenAt).getTime();
    return Date.now() - time < 5 * 60 * 1000;
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        u.email?.toLowerCase().includes(term) ||
        u.displayName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.uid.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === 'online') return isUserOnline(u);
      if (filterStatus === 'banned') return !!u.isBanned;
      if (filterStatus === 'admins') return u.role === 'admin' || u.email === 'lowai.official@gmail.com';
      if (filterStatus === 'go') return u.plan === 'go';

      return true;
    });
  }, [users, searchTerm, filterStatus]);

  // Filtered Chat Logs for Log User
  const filteredChatLogs = useMemo(() => {
    if (!chatLogSearch.trim()) return userChatLogs;
    const term = chatLogSearch.toLowerCase();
    return userChatLogs.filter(c => 
      c.title?.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term) ||
      c.messages?.some(m => m.content.toLowerCase().includes(term))
    );
  }, [userChatLogs, chatLogSearch]);

  const handleOpenLogs = async (targetUser: UserProfile) => {
    setLogUser(targetUser);
    setSelectedChatLog(null);
    setChatLogSearch('');
    setLoadingLogs(true);
    try {
      const logs = await getUserChatLogsForAdmin(targetUser.uid);
      setUserChatLogs(logs);
      if (logs.length > 0) {
        setSelectedChatLog(logs[0]);
      }
    } catch (e) {
      console.error(e);
      showNotification('Sohbet logları yüklenemedi.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleApproveClaim = async (claim: VipClaim) => {
    setActionClaimId(claim.id);
    try {
      await approveVipClaim(claim.userId, user?.email || 'admin');
      setVipClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'approved' } : c));
      setUsers(prev => prev.map(u => u.uid === claim.userId ? { ...u, plan: 'go' } : u));
      showNotification(`${claim.email || claim.displayName} kullanıcısının WnelAI Go üyeliği aktifleştirildi.`);
    } catch (e: any) {
      console.error(e);
      showNotification('VIP onayı verilirken hata oluştu.');
    } finally {
      setActionClaimId(null);
    }
  };

  const handleRejectClaim = async (claim: VipClaim) => {
    setActionClaimId(claim.id);
    try {
      await rejectVipClaim(claim.userId, user?.email || 'admin');
      setVipClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'rejected' } : c));
      setUsers(prev => prev.map(u => u.uid === claim.userId ? { ...u, plan: 'free' } : u));
      showNotification(`${claim.email || claim.displayName} başvurusu reddedildi.`);
    } catch (e: any) {
      console.error(e);
      showNotification('VIP reddi sırasında hata oluştu.');
    } finally {
      setActionClaimId(null);
    }
  };

  const handleSetUserPlan = async (targetUser: UserProfile, newPlan: 'free' | 'go') => {
    try {
      await setUserPlan(targetUser.uid, newPlan);
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, plan: newPlan } : u));
      if (selectedUser && selectedUser.uid === targetUser.uid) {
        setSelectedUser({ ...selectedUser, plan: newPlan });
      }
      showNotification(`${targetUser.displayName || targetUser.email} planı "${newPlan === 'go' ? 'WnelAI Go' : 'Free'}" olarak güncellendi.`);
    } catch (e: any) {
      console.error(e);
      showNotification('Plan güncellenemedi.');
    }
  };

  const handleConfirmBan = async () => {
    if (!banTarget) return;
    setIsBanning(true);
    try {
      await banUser(banTarget.uid, banReason);
      setUsers(prev => prev.map(u => u.uid === banTarget.uid ? { ...u, isBanned: true, banReason } : u));
      showNotification(`${banTarget.email} başarıyla yasaklandı.`);
      setBanTarget(null);
    } catch (e: any) {
      showNotification('Yasaklama işlemi başarısız.');
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async (targetUser: UserProfile) => {
    try {
      await unbanUser(targetUser.uid);
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, isBanned: false, banReason: '' } : u));
      showNotification(`${targetUser.email} yasağı kaldırıldı.`);
    } catch (e: any) {
      showNotification('Yasak kaldırılamadı.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUserAndData(deleteTarget.uid);
      setUsers(prev => prev.filter(u => u.uid !== deleteTarget.uid));
      setStats(prev => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - 1)
      }));
      showNotification(`${deleteTarget.email} ve tüm verileri silindi.`);
      setDeleteTarget(null);
    } catch (e: any) {
      showNotification('Kullanıcı silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  // ACCESS DENIED VIEW FOR NON-ADMINS
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#18181b] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">403 — Erişim Reddedildi</h3>
          <p className="text-sm text-zinc-400">
            Bu alana yalnızca yetkili WnelAI yöneticileri erişebilir. Güvenlik protokolü gereğince işleminiz kaydedilmiştir.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm cursor-pointer"
          >
            Panele Dön
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#0f0f12] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[94vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/5 bg-[#141418]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">WnelAI Yönetici Paneli</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-md border border-blue-500/30">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 hidden sm:block">Kullanıcı yönetimi, sohbet logları ve sistem izleme</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors border border-white/5 cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-blue-400")} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 right-4 sm:right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-blue-400/30 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{notification}</span>
          </motion.div>
        )}

        {/* Top Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-5 border-b border-white/5 bg-[#121216]/50">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">Toplam Kullanıcı</div>
              <div className="text-base sm:text-xl font-bold text-white mt-0.5">{stats.totalUsers}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">Çevrimiçi (Aktif)</div>
              <div className="text-base sm:text-xl font-bold text-green-400 mt-0.5">{stats.onlineUsers}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">Toplam Sohbet</div>
              <div className="text-base sm:text-xl font-bold text-white mt-0.5">{stats.totalChats}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">WnelAI Go Üye</div>
              <div className="text-base sm:text-xl font-bold text-amber-400 mt-0.5">
                {users.filter(u => u.plan === 'go').length}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2.5 border-b border-white/5 bg-[#101014]">
          <button
            onClick={() => setAdminTab('users')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer",
              adminTab === 'users' 
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcılar ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('vip_claims')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer relative",
              adminTab === 'vip_claims' 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>🎟️ WnelAI Go İstekleri</span>
            <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
              {vipClaims.length} / 5
            </span>
          </button>
        </div>

        {/* TAB 1: USERS */}
        {adminTab === 'users' && (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0e0e11]">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="E-posta, isim, @kullanıcı veya UID..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                    filterStatus === 'all' ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  Tümü ({users.length})
                </button>
                <button
                  onClick={() => setFilterStatus('go')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    filterStatus === 'go' ? "bg-amber-500/30 text-amber-200 border border-amber-500/50" : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <Rocket className="w-3 h-3 text-amber-400" />
                  WnelAI Go ({users.filter(u => u.plan === 'go').length})
                </button>
                <button
                  onClick={() => setFilterStatus('online')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    filterStatus === 'online' ? "bg-green-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Çevrimiçi
                </button>
                <button
                  onClick={() => setFilterStatus('banned')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    filterStatus === 'banned' ? "bg-red-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <Ban className="w-3 h-3" />
                  Yasaklı
                </button>
                <button
                  onClick={() => setFilterStatus('admins')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    filterStatus === 'admins' ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <ShieldCheck className="w-3 h-3" />
                  Yöneticiler
                </button>
              </div>
            </div>

            {/* Main Users Table / List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 scrollbar-thin scrollbar-thumb-white/10">
              {loading && users.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm font-medium text-zinc-300">Yönetici paneli verileri yükleniyor...</p>
                  <p className="text-xs text-zinc-500">Kullanıcı kayıtları ve istatistikler alınıyor.</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
                  <Users className="w-10 h-10 mb-3 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-400">Kullanıcı bulunamadı</p>
                  <p className="text-xs text-zinc-600 mt-1">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredUsers.map((u) => {
                    const online = isUserOnline(u);
                    const isRootAdmin = u.email === 'lowai.official@gmail.com' || u.role === 'admin';
                    const isGoUser = u.plan === 'go';

                    return (
                      <div
                        key={u.uid}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#1a1a20] border border-white/10 flex items-center justify-center">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                  {u.displayName?.[0] || u.email?.[0] || 'U'}
                                </div>
                              )}
                            </div>
                            {online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f12]" title="Çevrimiçi" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm truncate">{u.displayName || 'İsimsiz Kullanıcı'}</span>
                              {u.username && (
                                <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">@{u.username}</span>
                              )}
                              {isGoUser && (
                                <GoBadge size="xs" />
                              )}
                              {u.isEmailVerified ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Doğrulandı
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> Onay Bekliyor
                                </span>
                              )}
                              {isRootAdmin && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-semibold px-1.5 py-0.5 rounded border border-purple-500/30">
                                  Admin
                                </span>
                              )}
                              {u.isBanned && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                  <Ban className="w-2.5 h-2.5" /> Yasaklı
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-zinc-300 truncate max-w-[200px] sm:max-w-none">
                                <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span className="truncate">{u.email}</span>
                              </span>
                              <span className="text-zinc-600 hidden sm:inline">•</span>
                              <span className="font-mono text-[10px] sm:text-[11px] text-zinc-500 truncate max-w-[100px] sm:max-w-[140px]" title={u.uid}>
                                UID: {u.uid}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-white/5 md:border-t-0 justify-between md:justify-end">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {/* Plan Toggle Button */}
                            <button
                              onClick={() => handleSetUserPlan(u, isGoUser ? 'free' : 'go')}
                              className={cn(
                                "px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border flex items-center gap-1.5 cursor-pointer",
                                isGoUser
                                  ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30"
                                  : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5"
                              )}
                              title={isGoUser ? "Free'ye Düşür" : "Go'ya Yükselt"}
                            >
                              <Rocket className="w-3.5 h-3.5" />
                              <span>{isGoUser ? 'Plan: Go' : 'Plan: Free'}</span>
                            </button>

                            {/* View Profile Detail */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-xl transition-colors border border-white/5 flex items-center gap-1.5 cursor-pointer"
                              title="Profili Görüntüle"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                              <span>Profil</span>
                            </button>

                            {/* View Logs / Chats */}
                            <button
                              onClick={() => handleOpenLogs(u)}
                              className="px-2.5 sm:px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-semibold rounded-xl transition-colors border border-blue-500/30 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
                              title="Sohbet Logları"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Sohbetler</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Ban / Unban Toggle */}
                            {!isRootAdmin && (
                              u.isBanned ? (
                                <button
                                  onClick={() => handleUnban(u)}
                                  className="px-2.5 sm:px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-xl transition-colors border border-green-500/20 flex items-center gap-1 cursor-pointer"
                                  title="Banı Kaldır"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Ban Kaldır</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setBanTarget(u); setBanReason('Topluluk kurallarına aykırı davranış'); }}
                                  className="px-2.5 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium rounded-xl transition-colors border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                                  title="Kullanıcıyı Banla"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Banla</span>
                                </button>
                              )
                            )}

                            {/* Delete user */}
                            {!isRootAdmin && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                className="p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-xl transition-colors border border-red-500/20 cursor-pointer"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: VIP CLAIMS */}
        {adminTab === 'vip_claims' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {/* VIP Info Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>TikTok VIP Etkinliği Başvuru Takibi</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                      5 Kişilik Kontenjan
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kullanıcılar sohbette <code className="text-amber-300 font-mono">/claimvip</code> komutunu girdiğinde burada sırayla listelenir.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-black/30 p-2.5 rounded-xl border border-white/5">
                <div className="text-xs text-zinc-400">Dolu Kontenjan</div>
                <div className="text-base font-bold text-amber-300">
                  {vipClaims.length} / 5 Kullanıcı
                </div>
              </div>
            </div>

            {/* Claims List */}
            {vipClaims.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-500">
                <Rocket className="w-10 h-10 mb-3 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-400">Henüz VIP başvurusu bulunmuyor</p>
                <p className="text-xs text-zinc-600 mt-1">Kullanıcılar <code className="text-amber-400">/claimvip</code> komutu ile başvurduğunda burada görünecektir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vipClaims.map((claim) => {
                  const isApproved = claim.status === 'approved';
                  const isRejected = claim.status === 'rejected';
                  const isPending = claim.status === 'pending';
                  const isProcessing = actionClaimId === claim.id;

                  const dateFormatted = (claim.createdAt as any)?.toMillis 
                    ? new Date((claim.createdAt as any).toMillis()).toLocaleString('tr-TR')
                    : 'Bilinmiyor';

                  return (
                    <div
                      key={claim.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                        isApproved
                          ? "bg-amber-500/[0.04] border-amber-500/30"
                          : isRejected
                          ? "bg-red-500/[0.03] border-red-500/20"
                          : "bg-white/[0.03] border-white/10 shadow-lg shadow-black/20"
                      )}
                    >
                      {/* Left side: Order number and user info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Order Badge (#1, #2...) */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                          isApproved 
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : isRejected
                            ? "bg-red-500/20 border-red-500/40 text-red-400"
                            : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        )}>
                          #{claim.orderNumber}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm truncate">
                              {claim.displayName || 'İsimsiz Kullanıcı'}
                            </span>
                            {claim.username && (
                              <span className="text-xs text-zinc-400 font-mono">@{claim.username}</span>
                            )}
                            {isApproved && <GoBadge size="xs" />}
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Mail className="w-3 h-3 text-zinc-500" />
                              <span>{claim.email}</span>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span>{dateFormatted}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Status and Actions */}
                      <div className="flex items-center gap-3 justify-between md:justify-end border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                        {/* Status Chip */}
                        <div className="flex items-center gap-1.5">
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>🟢 Aktif (Go)</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>🔴 Reddedildi</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              <span>🟡 Onay Bekliyor</span>
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveClaim(claim)}
                            disabled={isProcessing || isApproved}
                            className={cn(
                              "px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md",
                              isApproved
                                ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/20"
                            )}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isApproved ? 'Onaylandı' : '✅ Aktifleştir'}</span>
                          </button>

                          <button
                            onClick={() => handleRejectClaim(claim)}
                            disabled={isProcessing || isRejected}
                            className={cn(
                              "px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
                              isRejected
                                ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                                : "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                            )}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Reddet</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUB-MODAL 1: USER PROFILE DETAIL ----------------- */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    Kullanıcı Profili
                  </h3>
                  <button onClick={() => setSelectedUser(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#1e1e24] border border-white/10 shrink-0">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white">
                        {selectedUser.displayName?.[0] || selectedUser.email?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-white truncate">{selectedUser.displayName || 'İsimsiz'}</h4>
                    <p className="text-xs text-blue-400 font-mono truncate">@{selectedUser.username || 'belirtilmemiş'}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between py-1 border-b border-white/5 gap-2">
                    <span className="text-zinc-400 shrink-0">UID:</span>
                    <span className="text-white font-mono truncate text-[11px]">{selectedUser.uid}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">Rol:</span>
                    <span className="text-white font-semibold uppercase">{selectedUser.role || 'user'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">Durum:</span>
                    <span className={cn("font-medium", selectedUser.isBanned ? "text-red-400" : "text-green-400")}>
                      {selectedUser.isBanned ? `Yasaklı (${selectedUser.banReason || 'Belirtilmedi'})` : 'Aktif'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">Canlı Durum:</span>
                    <span className={isUserOnline(selectedUser) ? "text-green-400 font-semibold" : "text-zinc-500"}>
                      {isUserOnline(selectedUser) ? '🟢 Çevrimiçi' : '⚪ Çevrimdışı'}
                    </span>
                  </div>
                  {selectedUser.bio && (
                    <div className="pt-2">
                      <span className="text-zinc-400 block mb-1">Biyografi:</span>
                      <p className="text-zinc-300 italic">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const target = selectedUser;
                      setSelectedUser(null);
                      handleOpenLogs(target);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Sohbetleri Aç</span>
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ----------------- SUB-MODAL 2: USER CHAT LOGS (RESPONSIVE MASTERPIECE) ----------------- */}
        <AnimatePresence>
          {logUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-[#121216] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[94vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/5 bg-[#18181c] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/25 shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">Sohbet Logları & Mesaj Geçmişi</h3>
                        <span className="text-[10px] bg-white/10 text-zinc-300 font-semibold px-2 py-0.5 rounded-md hidden sm:inline">
                          {userChatLogs.length} Sohbet
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                        {logUser.displayName ? `${logUser.displayName} (${logUser.email})` : logUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenLogs(logUser)}
                      disabled={loadingLogs}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                      title="Yenile"
                    >
                      <RefreshCw className={cn("w-4 h-4", loadingLogs && "animate-spin text-blue-400")} />
                    </button>
                    <button 
                      onClick={() => setLogUser(null)} 
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content: Fully Adaptive Split/Master-Detail */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
                  
                  {/* Left Column: Chat List (Hidden on mobile when a chat is selected) */}
                  <div className={cn(
                    "w-full md:w-80 md:border-r border-white/5 flex flex-col bg-[#0e0e11] shrink-0 h-full",
                    selectedChatLog ? "hidden md:flex" : "flex"
                  )}>
                    {/* Search inside user's chats */}
                    <div className="p-3 border-b border-white/5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={chatLogSearch}
                          onChange={(e) => setChatLogSearch(e.target.value)}
                          placeholder="Sohbet veya mesaj ara..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Chat items list */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                      {loadingLogs ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="text-xs">Sohbetler taranıyor...</span>
                        </div>
                      ) : filteredChatLogs.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs px-4">
                          {chatLogSearch ? 'Aramaya uygun sohbet bulunamadı.' : 'Kullanıcının henüz bir sohbeti yok.'}
                        </div>
                      ) : (
                        filteredChatLogs.map((chat) => {
                          const isSelected = selectedChatLog?.id === chat.id;
                          return (
                            <button
                              key={chat.id}
                              onClick={() => setSelectedChatLog(chat)}
                              className={cn(
                                "w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 cursor-pointer relative group",
                                isSelected 
                                  ? "bg-blue-600/15 border-blue-500/40 text-white shadow-sm shadow-blue-500/10" 
                                  : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn("font-semibold truncate flex-1", isSelected ? "text-white" : "text-zinc-200")}>
                                  {chat.title || 'İsimsiz Sohbet'}
                                </span>
                                <ChevronRight className={cn(
                                  "w-3.5 h-3.5 shrink-0 transition-transform", 
                                  isSelected ? "text-blue-400 translate-x-0.5" : "text-zinc-600 group-hover:text-zinc-400"
                                )} />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                <span className="flex items-center gap-1 font-mono">
                                  <MessageCircle className="w-3 h-3 text-zinc-500" />
                                  {chat.messageCount ?? chat.messages?.length ?? 0} mesaj
                                </span>
                                {chat.isPinned && (
                                  <span className="text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                                    📌 Sabit
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Message Stream / Inspector */}
                  <div className={cn(
                    "flex-1 flex flex-col bg-[#121216] h-full min-w-0 overflow-hidden",
                    !selectedChatLog ? "hidden md:flex" : "flex"
                  )}>
                    {selectedChatLog ? (
                      <>
                        {/* Selected Chat Top Bar */}
                        <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-[#141418] flex items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Back button on Mobile */}
                            <button
                              onClick={() => setSelectedChatLog(null)}
                              className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1 text-xs cursor-pointer shrink-0"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Sohbetler</span>
                            </button>

                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                                {selectedChatLog.title || 'İsimsiz Sohbet'}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                                <span className="font-mono truncate max-w-[140px] sm:max-w-[240px]">
                                  ID: {selectedChatLog.id}
                                </span>
                                <span>•</span>
                                <span>{selectedChatLog.messages?.length || 0} Mesaj Kaydı</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const conversationText = (selectedChatLog.messages || [])
                                .map(m => `[${m.role === 'user' ? 'KULLANICI' : 'WNELAI'}]:\n${m.content}\n`)
                                .join('\n----------------------------------------\n\n');
                              handleCopyText(conversationText, selectedChatLog.id);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                            title="Tüm sohbeti kopyala"
                          >
                            {copiedMessageId === selectedChatLog.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400 text-[11px]">Kopyalandı</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Tümünü Kopyala</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Messages Stream */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                          {selectedChatLog.messages && selectedChatLog.messages.length > 0 ? (
                            selectedChatLog.messages.map((m, idx) => {
                              const isUserMsg = m.role === 'user';
                              const msgKey = `${selectedChatLog.id}-${idx}`;
                              const isCopied = copiedMessageId === msgKey;

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={cn(
                                    "flex flex-col gap-1 max-w-[95%] sm:max-w-[85%]",
                                    isUserMsg ? "ml-auto items-end" : "mr-auto items-start"
                                  )}
                                >
                                  {/* Role and metadata bar */}
                                  <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-500 font-medium">
                                    <span className={cn(
                                      "flex items-center gap-1 font-semibold",
                                      isUserMsg ? "text-blue-400" : "text-zinc-300"
                                    )}>
                                      {isUserMsg ? (
                                        <>
                                          <UserIcon className="w-3 h-3 text-blue-400" />
                                          <span>Kullanıcı</span>
                                        </>
                                      ) : (
                                        <>
                                          <WnelLogo size="xs" withGlow={false} />
                                          <span>WnelAI</span>
                                        </>
                                      )}
                                    </span>
                                    <span>•</span>
                                    <span>#{idx + 1}</span>
                                    <button
                                      onClick={() => handleCopyText(m.content, msgKey)}
                                      className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
                                      title="Mesajı kopyala"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3 h-3 text-green-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Message Body */}
                                  <div
                                    className={cn(
                                      "p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap select-text border shadow-sm",
                                      isUserMsg
                                        ? "bg-blue-600/15 border-blue-500/25 text-white"
                                        : "bg-white/[0.04] border-white/10 text-zinc-200"
                                    )}
                                  >
                                    {m.content}
                                  </div>
                                </motion.div>
                              );
                            })
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-12 gap-2">
                              <Info className="w-6 h-6 text-zinc-600" />
                              <span>Bu sohbette kayıtlı mesaj bulunamadı.</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs p-8 text-center gap-2">
                        <MessageSquare className="w-10 h-10 text-zinc-700 mb-1" />
                        <span className="font-medium text-zinc-400">Sohbet Seçin</span>
                        <span className="text-[11px] text-zinc-600 max-w-xs">
                          Kullanıcının mesaj geçmişini ve diyaloglarını incelemek için sol taraftan bir sohbet seçin.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ----------------- SUB-MODAL 3: BAN USER ----------------- */}
        <AnimatePresence>
          {banTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#16161a] border border-amber-500/30 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-400">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <Ban className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate">Kullanıcıyı Yasakla</h3>
                    <p className="text-xs text-zinc-400 truncate">{banTarget.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Yasaklama Sebebi</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                    placeholder="Yasaklama sebebini belirtin..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setBanTarget(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConfirmBan}
                    disabled={isBanning}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isBanning ? 'Yasaklanıyor...' : 'Yasakla'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ----------------- SUB-MODAL 4: DELETE USER ----------------- */}
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#16161a] border border-red-500/30 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base truncate">Kullanıcıyı ve Verilerini Sil</h3>
                    <p className="text-xs text-zinc-400 truncate">{deleteTarget.email}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bu kullanıcının hesabı, profil kayıtları ve oluşturduğu tüm sohbet geçmişi kalıcı olarak veritabanından silinecektir. Bu işlem geri alınamaz.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
