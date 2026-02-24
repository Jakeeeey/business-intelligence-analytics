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
    999
  );
  return endOfDay.getTime();
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

/**
 * Get data from cache
 */
export function getCacheData<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    
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
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Set data in cache with end-of-day expiration
 */
export function setCacheData<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined') return;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: getEndOfDayTimestamp(),
    };
    
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(prefix?: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (prefix && !key.startsWith(prefix)) return;
      
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;
        
        const entry = JSON.parse(cached);
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}
