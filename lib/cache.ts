/**
 * In-Memory Cache System
 * 
 * TTL-based caching for standalone architecture
 * Features:
 * - Time-to-live (TTL) expiration
 * - Type-safe get/set
 * - Manual invalidation
 * - Statistics tracking
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
  hits: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private stats = {
    sets: 0,
    gets: 0,
    hits: 0,
    misses: 0,
    expirations: 0,
  };

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    this.stats.gets++;

    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
    this.stats.sets++;
  }

  /**
   * Delete specific key
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate by pattern (prefix match)
   */
  invalidateByPattern(pattern: string): void {
    this.store.forEach((_, key) => {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.store.delete(key);
      }
    });
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.gets > 0
      ? (this.stats.hits / this.stats.gets * 100).toFixed(2)
      : '0.00';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.store.size,
    };
  }

  /**
   * Get keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get entry with metadata
   */
  getEntry<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key);
      this.stats.expirations++;
      return null;
    }

    return entry;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    this.store.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        this.store.delete(key);
        cleaned++;
        this.stats.expirations++;
      }
    });

    return cleaned;
  }
}

// Singleton instance
export const cache = new Cache();

// Auto-cleanup every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanup();
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, 10 * 60 * 1000);
}

export default cache;
