/**
 * Generic in-memory cache with Time-To-Live (TTL) support.
 * Used for caching expensive database queries with automatic expiration.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Generic TTL cache class - thread-unsafe but fine for Node.js single-threaded model.
 * @param ttlMs - Time-to-live in milliseconds (default: 60,000 = 60 seconds)
 */
export class TTLCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private ttlMs: number

  constructor(ttlMs: number = 60_000) {
    this.cache = new Map()
    this.ttlMs = ttlMs
  }

  /**
   * Gets a value from the cache if it exists and hasn't expired.
   * @param key - Cache key
   * @returns The cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.ttlMs) {
      // Entry has expired, remove it
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Sets a value in the cache with the current timestamp.
   * @param key - Cache key
   * @param data - Data to cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Invalidates (removes) a specific cache entry.
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Gets all current keys in the cache (for debugging/monitoring).
   * Expired entries are removed before returning keys.
   * @returns Array of cache keys
   */
  keys(): string[] {
    const now = Date.now()
    const validKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= this.ttlMs) {
        validKeys.push(key)
      } else {
        // Remove expired entry
        this.cache.delete(key)
      }
    }
    
    return validKeys
  }

  /**
   * Gets the number of entries in the cache.
   * @returns Number of cached entries
   */
  size(): number {
    return this.cache.size
  }
}