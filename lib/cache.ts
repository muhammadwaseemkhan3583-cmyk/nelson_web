// Client-side in-memory and sessionStorage cache for background fast loading
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheItem<any>>();

export function getCachedData<T>(key: string, maxAgeMs: number = 10 * 60 * 1000): T | null {
  const now = Date.now();

  // 1. Check in-memory cache first
  const memItem = memoryCache.get(key);
  if (memItem && now - memItem.timestamp < maxAgeMs) {
    return memItem.data as T;
  }

  // 2. Fallback to sessionStorage
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(`app_cache_${key}`);
      if (stored) {
        const parsed: CacheItem<T> = JSON.parse(stored);
        if (now - parsed.timestamp < maxAgeMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // ignore storage error
    }
  }

  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  const item: CacheItem<T> = {
    data,
    timestamp: Date.now(),
  };
  memoryCache.set(key, item);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(item));
    } catch {
      // ignore storage error
    }
  }
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("app_cache_")) sessionStorage.removeItem(k);
        });
      } catch {}
    }
    return;
  }

  memoryCache.forEach((_, k) => {
    if (k.startsWith(keyPrefix)) memoryCache.delete(k);
  });
  if (typeof window !== "undefined") {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(`app_cache_${keyPrefix}`)) sessionStorage.removeItem(k);
      });
    } catch {}
  }
}
