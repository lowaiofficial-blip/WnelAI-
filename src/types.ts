export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
};

export type Model = {
  id: string;
  name: string;
  description: string;
  disabled?: boolean;
};

export interface UserSettings {
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  theme: 'dark' | 'light';
  soundEffects: boolean;
}

export type UserPlan = 'free' | 'go';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  role?: 'admin' | 'user';
  plan?: UserPlan;
  createdAt?: any;
  updatedAt?: any;
  lastSeenAt?: any;
  isBanned?: boolean;
  banReason?: string;
  thinkingCooldownUntil?: number;
  thinkingUsesToday?: number;
  thinkingLastUsedDate?: string;
  chatCountToday?: number;
  chatLastDate?: string;
  voiceSecondsUsedToday?: number;
  voiceLastUsedDate?: string;
  isEmailVerified?: boolean;
  settings?: UserSettings;
}

export interface EmailVerification {
  userId: string;
  email: string;
  displayName?: string;
  username?: string;
  code?: string;
  createdAt: any;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  verifiedAt?: any;
}

export interface VipClaim {
  id?: string;
  userId: string;
  email: string;
  displayName: string;
  username: string;
  orderNumber: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
}

export interface VipCampaign {
  id?: string;
  claimedCount: number;
  maxClaims: number;
  updatedAt: any;
}

export interface BrandingSettings {
  logoUrl?: string;
  faviconUrl?: string;
  updatedAt?: string | number | any;
  updatedBy?: string;
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'qwen/qwen-plus',
    name: '⚡ Hızlı',
    description: 'Qwen Plus (OpenRouter/Groq) - Anında ve akıcı hızlı yanıtlar.',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: '🧠 Düşünen',
    description: 'DeepSeek R1 - Kodlama, algoritmalar ve karmaşık mantık için derin düşünme.',
  },
];

