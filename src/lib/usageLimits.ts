import { UserPlan, PLANS_CONFIG, FREE_CHAT_LIMIT, GO_CHAT_LIMIT, GO_THINKING_DAILY_LIMIT, FREE_VOICE_LIMIT_SECONDS, GO_VOICE_LIMIT_SECONDS } from '../config/plans';
import { getThinkingCooldownUntil } from './thinkingCooldown';
import { UserProfile } from '../types';

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// Format seconds into MM:SS (e.g., 300 -> "05:00", 124 -> "02:04")
export function formatSecondsToTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSecs = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

function getUsageStorageKey(userId: string | undefined, type: 'chat' | 'thinking' | 'voice'): string {
  const userSegment = userId ? `user_${userId}` : 'guest';
  const today = getTodayString();
  return `wnelai_usage_${type}_${userSegment}_${today}`;
}

export function getDailyUsage(userId: string | undefined, type: 'chat' | 'thinking'): number {
  try {
    const key = getUsageStorageKey(userId, type);
    const val = localStorage.getItem(key);
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export function incrementDailyUsage(userId: string | undefined, type: 'chat' | 'thinking'): number {
  try {
    const key = getUsageStorageKey(userId, type);
    const current = getDailyUsage(userId, type);
    const updated = current + 1;
    localStorage.setItem(key, updated.toString());
    return updated;
  } catch {
    return 1;
  }
}

// Voice Local Storage Cache & Sync
export function getDailyVoiceUsageLocal(userId: string | undefined): number {
  try {
    const key = getUsageStorageKey(userId, 'voice');
    const val = localStorage.getItem(key);
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
  } catch {
    return 0;
  }
}

export function recordVoiceUsageLocal(userId: string | undefined, seconds: number): number {
  try {
    const key = getUsageStorageKey(userId, 'voice');
    const current = getDailyVoiceUsageLocal(userId);
    const updated = Math.max(0, current + Math.round(seconds));
    localStorage.setItem(key, updated.toString());
    return updated;
  } catch {
    return 0;
  }
}

export function setDailyVoiceUsageLocal(userId: string | undefined, seconds: number): void {
  try {
    const key = getUsageStorageKey(userId, 'voice');
    localStorage.setItem(key, Math.max(0, Math.round(seconds)).toString());
  } catch {}
}

export interface VoiceUsageStatus {
  usedSeconds: number;
  limitSeconds: number;
  remainingSeconds: number;
  allowed: boolean;
  formattedUsed: string;
  formattedRemaining: string;
  formattedLimit: string;
}

export function getVoiceDailyLimitSeconds(plan: UserPlan = 'free'): number {
  return plan === 'go' ? GO_VOICE_LIMIT_SECONDS : FREE_VOICE_LIMIT_SECONDS;
}

export function getVoiceUsageStatus(
  profile: UserProfile | null,
  plan: UserPlan = 'free',
  userId?: string
): VoiceUsageStatus {
  const effectivePlan: UserPlan = (profile?.plan === 'go' || plan === 'go') ? 'go' : 'free';
  const limitSeconds = getVoiceDailyLimitSeconds(effectivePlan);

  const today = getTodayString();
  let usedSeconds = 0;

  if (profile) {
    if (profile.voiceLastUsedDate === today) {
      usedSeconds = profile.voiceSecondsUsedToday || 0;
    } else {
      // New day -> 0
      usedSeconds = 0;
    }
  } else {
    // Guest or unauthenticated -> local storage
    usedSeconds = getDailyVoiceUsageLocal(userId);
  }

  const remainingSeconds = Math.max(0, limitSeconds - usedSeconds);
  const allowed = remainingSeconds > 0;

  return {
    usedSeconds,
    limitSeconds,
    remainingSeconds,
    allowed,
    formattedUsed: formatSecondsToTime(usedSeconds),
    formattedRemaining: formatSecondsToTime(remainingSeconds),
    formattedLimit: formatSecondsToTime(limitSeconds),
  };
}

export interface ChatLimitStatus {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
}

export function checkChatLimit(plan: UserPlan = 'free', userId?: string): ChatLimitStatus {
  const count = getDailyUsage(userId, 'chat');
  const limit = plan === 'go' ? GO_CHAT_LIMIT : FREE_CHAT_LIMIT;
  const remaining = Math.max(0, limit - count);
  return {
    allowed: count < limit,
    count,
    limit,
    remaining
  };
}

export interface ThinkingLimitStatus {
  allowed: boolean;
  plan: UserPlan;
  reason?: 'cooldown' | 'daily_limit';
  cooldownUntil?: number;
  countToday: number;
  limitToday: number;
}

export function checkThinkingLimit(
  plan: UserPlan = 'free',
  userId?: string,
  profileCooldown?: number
): ThinkingLimitStatus {
  const isGo = plan === 'go';

  if (isGo) {
    // Go Users: 10 uses / day, no 3h cooldown
    const count = getDailyUsage(userId, 'thinking');
    const limit = GO_THINKING_DAILY_LIMIT;
    if (count >= limit) {
      return {
        allowed: false,
        plan: 'go',
        reason: 'daily_limit',
        countToday: count,
        limitToday: limit
      };
    }
    return {
      allowed: true,
      plan: 'go',
      countToday: count,
      limitToday: limit
    };
  }

  // Free Users: 1 use then 3h cooldown
  const cooldownUntil = getThinkingCooldownUntil(userId, profileCooldown);
  if (cooldownUntil > Date.now()) {
    return {
      allowed: false,
      plan: 'free',
      reason: 'cooldown',
      cooldownUntil,
      countToday: 1,
      limitToday: 1
    };
  }

  return {
    allowed: true,
    plan: 'free',
    countToday: 0,
    limitToday: 1
  };
}
