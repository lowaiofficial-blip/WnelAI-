export type UserPlan = 'free' | 'go';

export interface PlanConfig {
  id: UserPlan;
  name: string;
  badge: string;
  tagline: string;
  chatLimit: number;
  thinkingDailyLimit: number;
  thinkingCooldownMs: number;
  voiceDailyLimitSeconds: number;
  fileUploadAllowed: boolean;
  priorityProcessing: boolean;
  features: string[];
}

export const PLANS_CONFIG: Record<UserPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'WnelAI Free',
    badge: 'Free',
    tagline: 'Temel yapay zeka deneyimi',
    chatLimit: 30, // FREE_CHAT_LIMIT: 30 messages/day
    thinkingDailyLimit: 1, // 1 use then 3h cooldown
    thinkingCooldownMs: 3 * 60 * 60 * 1000, // 3 hours
    voiceDailyLimitSeconds: 5 * 60, // 5 minutes / day (300 seconds)
    fileUploadAllowed: false,
    priorityProcessing: false,
    features: [
      '⚡ Hızlı Mod (Sınırsız)',
      '🎙️ Günlük 5 dk Sesli AI konuşma',
      '🧠 Düşünen Mod (1 kullanım, 3 saat bekleme)',
      '💬 Günlük 30 sohbet mesajı',
      '❌ Dosya yükleme desteği yok'
    ]
  },
  go: {
    id: 'go',
    name: 'WnelAI Go',
    badge: '🚀 Go',
    tagline: 'Daha fazla güç. Daha fazla özgürlük.',
    chatLimit: 500, // GO_CHAT_LIMIT: 500 messages/day
    thinkingDailyLimit: 10, // 10 uses per day
    thinkingCooldownMs: 0, // No 3h cooldown
    voiceDailyLimitSeconds: 60 * 60, // 60 minutes / day (3600 seconds)
    fileUploadAllowed: true,
    priorityProcessing: true,
    features: [
      '⚡ Hızlı Mod (Öncelikli işlem)',
      '🎙️ Günlük 60 dk Sesli AI konuşma',
      '🧠 Düşünen Mod (10 kullanım/gün, bekleme süresiz)',
      '📎 Dosya ve görsel yükleme',
      '💬 Çok daha yüksek sohbet limiti (500/gün)',
      '🚀 Öncelikli işlem kuyruğu',
      '🎟️ Özel 🚀 Go profil rozeti'
    ]
  }
};

// Centralized limit references
export const FREE_CHAT_LIMIT = PLANS_CONFIG.free.chatLimit;
export const GO_CHAT_LIMIT = PLANS_CONFIG.go.chatLimit;
export const FREE_THINKING_LIMIT = PLANS_CONFIG.free.thinkingDailyLimit;
export const GO_THINKING_DAILY_LIMIT = PLANS_CONFIG.go.thinkingDailyLimit;
export const FREE_VOICE_LIMIT_SECONDS = PLANS_CONFIG.free.voiceDailyLimitSeconds; // 300s (5 mins)
export const GO_VOICE_LIMIT_SECONDS = PLANS_CONFIG.go.voiceDailyLimitSeconds; // 3600s (60 mins)
export const MAX_VIP_CAMPAIGN_CLAIMS = 5;
