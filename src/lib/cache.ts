// Cache utility for API responses
class ApiCache {
  private static CACHE_PREFIX = "api_cache_";
  private static DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheData),
      );
    } catch (error) {
      console.warn("Cache write failed:", error);
    }
  }

  static get(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheData.timestamp > cacheData.ttl) {
        // Cache expired
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Cache read failed:", error);
      return null;
    }
  }

  static clear(key?: string): void {
    try {
      if (key) {
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
      } else {
        // Clear all cache entries
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(this.CACHE_PREFIX),
        );
        keys.forEach((k) => localStorage.removeItem(k));
      }
    } catch (error) {
      console.warn("Cache clear failed:", error);
    }
  }

  static invalidate(pattern: string): void {
    try {
      const keys = Object.keys(localStorage).filter(
        (k) => k.startsWith(this.CACHE_PREFIX) && k.includes(pattern),
      );
      console.log(
        `Invalidating ${keys.length} cache entries matching "${pattern}":`,
        keys,
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn("Cache invalidation failed:", error);
    }
  }
}

export default ApiCache;
