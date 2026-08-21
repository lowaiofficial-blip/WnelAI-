export type UserPlan = 'free' | 'go';

export interface PlanConfig {
  id: UserPlan;
  name: string;
  badge: string;
  tagline: string;
  chatLimit: number;
  thinkingDailyLimit: number;
  thinkingCooldownMs: number;
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
    fileUploadAllowed: false,
    priorityProcessing: false,
    features: [
      '⚡ Hızlı Mod (Sınırsız)',
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
    fileUploadAllowed: true,
    priorityProcessing: true,
    features: [
      '⚡ Hızlı Mod (Öncelikli işlem)',
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
export const MAX_VIP_CAMPAIGN_CLAIMS = 5;
