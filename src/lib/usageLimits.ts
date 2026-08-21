import { UserPlan, PLANS_CONFIG, FREE_CHAT_LIMIT, GO_CHAT_LIMIT, GO_THINKING_DAILY_LIMIT } from '../config/plans';
import { getThinkingCooldownUntil } from './thinkingCooldown';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsageStorageKey(userId: string | undefined, type: 'chat' | 'thinking'): string {
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
