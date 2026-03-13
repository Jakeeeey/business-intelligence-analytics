// Cache utility for managing offline data storage with end-of-day expiration

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export function getEndOfDayTimestamp(): number {
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return endOfDay.getTime();
}

export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${prefix}:${sortedParams}`;
}

export function getCacheData<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCacheData<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined") return;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: getEndOfDayTimestamp(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      return;
    } catch {
      // If quota exceeded, try to free space by clearing expired entries
      try {
        clearExpiredCache();
      } catch {
        // ignore
      }

      // Attempt to evict oldest entries within the same prefix
      try {
        const prefix = key.split(":")[0];
        const candidates: { k: string; ts: number }[] = [];
        for (const k of Object.keys(localStorage)) {
          if (!k.startsWith(prefix + ":")) continue;
          try {
            const e = JSON.parse(
              localStorage.getItem(k) as string,
            ) as CacheEntry<unknown>;
            candidates.push({ k, ts: e.timestamp || 0 });
          } catch {
            // invalid entry — remove it
            try {
              localStorage.removeItem(k);
            } catch {}
          }
        }
        candidates.sort((a, b) => a.ts - b.ts);
        // Remove up to 10 oldest entries
        for (let i = 0; i < Math.min(10, candidates.length); i++) {
          try {
            localStorage.removeItem(candidates[i].k);
          } catch {}
          try {
            localStorage.setItem(key, JSON.stringify(entry));
            return;
          } catch {
            // continue evicting
          }
        }
      } catch {
        // fallback: ignore
      }
    }
  } catch {
    // ignore errors — cache is best-effort
  }
}

export function clearExpiredCache(prefix?: string): void {
  try {
    if (typeof window === "undefined") return;
    const now = Date.now();
    Object.keys(localStorage).forEach((key) => {
      if (prefix && !key.startsWith(prefix)) return;
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;
        const entry = JSON.parse(cached);
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // ignore
  }
}
