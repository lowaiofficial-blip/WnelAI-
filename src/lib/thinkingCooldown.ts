export const THINKING_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours in ms
const GLOBAL_KEY = 'wnelai_thinking_cooldown_until';

function getUserStorageKey(userId?: string | null): string {
  if (userId) {
    return `wnelai_thinking_cooldown_user_${userId}`;
  }
  return GLOBAL_KEY;
}

/**
 * Format a timestamp to local time HH:MM (e.g. 17:32)
 */
export function getLocalFormattedTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  } catch (error) {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

// Backward compatibility alias
export const getIstanbulFormattedTime = getLocalFormattedTime;

/**
 * Get current thinking cooldown expiration timestamp in ms for a specific user (or 0 if not in cooldown)
 */
export function getThinkingCooldownUntil(userId?: string | null, profileCooldown?: number): number {
  const now = Date.now();
  // 1. If profile from Firestore has active cooldown, return it
  if (profileCooldown && typeof profileCooldown === 'number' && profileCooldown > now) {
    return profileCooldown;
  }

  // 2. Otherwise check user-specific localStorage
  if (userId) {
    try {
      const userVal = localStorage.getItem(getUserStorageKey(userId));
      if (userVal) {
        const timestamp = parseInt(userVal, 10);
        if (!isNaN(timestamp) && timestamp > now) {
          return timestamp;
        } else {
          localStorage.removeItem(getUserStorageKey(userId));
        }
      }
    } catch {
      // ignore
    }
    return 0;
  }

  // 3. Fallback for unauthenticated/guest
  try {
    const val = localStorage.getItem(GLOBAL_KEY);
    if (!val) return 0;
    const timestamp = parseInt(val, 10);
    if (isNaN(timestamp) || timestamp <= now) {
      localStorage.removeItem(GLOBAL_KEY);
      return 0;
    }
    return timestamp;
  } catch {
    return 0;
  }
}

/**
 * Set thinking cooldown timestamp to 3 hours from now for a specific user
 */
export function setThinkingCooldown(userId?: string | null): number {
  const unlockTimestamp = Date.now() + THINKING_COOLDOWN_MS;
  try {
    if (userId) {
      localStorage.setItem(getUserStorageKey(userId), unlockTimestamp.toString());
      // Remove any global legacy key
      localStorage.removeItem(GLOBAL_KEY);
    } else {
      localStorage.setItem(GLOBAL_KEY, unlockTimestamp.toString());
    }
  } catch (e) {
    console.error("Failed to save cooldown in localStorage", e);
  }
  return unlockTimestamp;
}

/**
 * Returns human-readable remaining time (e.g. "2 saat 45 dk" or "32 dk")
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return "0 dk";
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} saat ${minutes > 0 ? `${minutes} dk` : ''}`.trim();
  }
  return `${minutes} dk`;
}

/**
 * Generate standard Turkish notice message requested by user:
 * "Saat {HH:MM}'a/e kadar düşünen mod limitiniz dolmuştur."
 */
export function getThinkingLimitMessage(cooldownUntil: number): string {
  const timeStr = getLocalFormattedTime(cooldownUntil);
  return `Saat ${timeStr}'ye kadar düşünen mod limitiniz dolmuştur. (3 saat sonra yeniden kullanılabilir)`;
}
