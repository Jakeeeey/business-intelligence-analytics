// Cache utility for managing offline data storage with end-of-day expiration

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Get end of day timestamp (23:59:59.999)
 */
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

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${key}=${JSON.stringify((params as Record<string, unknown>)[key])}`,
    )
    .join("&");
  return `${prefix}:${sortedParams}`;
}

/**
 * Get data from cache
 */
export function getCacheData<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

/**
 * Set data in cache with end-of-day expiration
 */
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
    } catch (err) {
      try {
        clearExpiredCache();
      } catch {}
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
            try {
              localStorage.removeItem(k);
            } catch {}
          }
        }
        candidates.sort((a, b) => a.ts - b.ts);
        for (let i = 0; i < Math.min(10, candidates.length); i++) {
          try {
            localStorage.removeItem(candidates[i].k);
          } catch {}
          try {
            localStorage.setItem(key, JSON.stringify(entry));
            return;
          } catch {
            // continue
          }
        }
      } catch {
        // ignore
      }
      console.error("Error writing cache:", err);
    }
  } catch (error) {
    console.error("Error writing cache:", error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(prefix?: string): void {
  try {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (prefix && !key.startsWith(prefix)) return;

      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;

        const entry = JSON.parse(cached);
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing expired cache:", error);
  }
}
