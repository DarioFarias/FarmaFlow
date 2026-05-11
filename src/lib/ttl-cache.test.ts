import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TTLCache } from './ttl-cache'

describe('TTLCache<T>', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const cache = new TTLCache<number>(60_000)
      cache.set('key1', 42)
      expect(cache.get('key1')).toBe(42)
    })

    it('should return null for non-existent key', () => {
      const cache = new TTLCache<string>(60_000)
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should store complex objects', () => {
      const cache = new TTLCache<object>(60_000)
      const obj = { name: 'test', value: 123 }
      cache.set('obj', obj)
      expect(cache.get('obj')).toEqual(obj)
    })

    it('should overwrite existing key with new value', () => {
      const cache = new TTLCache<string>(60_000)
      cache.set('key', 'first')
      cache.set('key', 'second')
      expect(cache.get('key')).toBe('second')
    })
  })

  describe('TTL expiry', () => {
    it('should return null after TTL expires', () => {
      const cache = new TTLCache<string>(30_000) // 30 seconds
      cache.set('key', 'value')

      // Advance time by 31 seconds
      vi.advanceTimersByTime(31_000)

      expect(cache.get('key')).toBeNull()
    })

    it('should return cached value before TTL expires', () => {
      const cache = new TTLCache<string>(60_000) // 60 seconds
      cache.set('key', 'value')

      // Advance time by 59 seconds (still valid)
      vi.advanceTimersByTime(59_000)

      expect(cache.get('key')).toBe('value')
    })

    it('should expire at exact TTL boundary', () => {
      const cache = new TTLCache<string>(30_000) // 30 seconds
      cache.set('key', 'value')

      // Advance time by exactly 30 seconds
      vi.advanceTimersByTime(30_000)

      // At exactly TTL, it's still valid (expiry check is > TTL)
      expect(cache.get('key')).toBe('value')

      // Advance by 1 more ms
      vi.advanceTimersByTime(1)
      expect(cache.get('key')).toBeNull()
    })
  })

  describe('invalidate', () => {
    it('should remove a specific entry', () => {
      const cache = new TTLCache<string>(60_000)
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.invalidate('key1')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })

    it('should not affect other entries', () => {
      const cache = new TTLCache<number>(60_000)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      cache.invalidate('b')

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeNull()
      expect(cache.get('c')).toBe(3)
    })

    it('should handle invalidating non-existent key gracefully', () => {
      const cache = new TTLCache<string>(60_000)
      expect(() => cache.invalidate('nonexistent')).not.toThrow()
    })
  })

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new TTLCache<string>(60_000)
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.clear()

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBeNull()
    })

    it('should handle clearing empty cache', () => {
      const cache = new TTLCache<string>(60_000)
      expect(() => cache.clear()).not.toThrow()
    })
  })

  describe('keys()', () => {
    it('should return all active keys', () => {
      const cache = new TTLCache<number>(60_000)
      cache.set('a', 1)
      cache.set('b', 2)

      const keys = cache.keys()
      expect(keys).toContain('a')
      expect(keys).toContain('b')
      expect(keys).toHaveLength(2)
    })

    it('should return empty array for empty cache', () => {
      const cache = new TTLCache<number>(60_000)
      expect(cache.keys()).toEqual([])
    })

    it('should not include expired keys', () => {
      const cache = new TTLCache<string>(30_000)
      cache.set('key1', 'value1')

      // Advance time past TTL for key1
      vi.advanceTimersByTime(31_000)

      // Set key2 now (has recent timestamp)
      cache.set('key2', 'value2')

      const keys = cache.keys()
      expect(keys).toContain('key2')
      expect(keys).not.toContain('key1')
    })
  })

  describe('size()', () => {
    it('should return correct number of entries', () => {
      const cache = new TTLCache<number>(60_000)
      expect(cache.size()).toBe(0)

      cache.set('a', 1)
      expect(cache.size()).toBe(1)

      cache.set('b', 2)
      expect(cache.size()).toBe(2)

      cache.invalidate('a')
      expect(cache.size()).toBe(1)
    })

    it('should return 0 after clear', () => {
      const cache = new TTLCache<number>(60_000)
      cache.set('a', 1)
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('custom TTL', () => {
    it('should use custom TTL of 1 second', () => {
      const cache = new TTLCache<string>(1_000) // 1 second
      cache.set('key', 'value')

      vi.advanceTimersByTime(500)
      expect(cache.get('key')).toBe('value')

      vi.advanceTimersByTime(501)
      expect(cache.get('key')).toBeNull()
    })

    it('should use custom TTL of 5 minutes', () => {
      const cache = new TTLCache<string>(5 * 60 * 1000) // 5 minutes
      cache.set('key', 'value')

      vi.advanceTimersByTime(4 * 60 * 1000) // 4 minutes
      expect(cache.get('key')).toBe('value')

      vi.advanceTimersByTime(61 * 1000) // 1 more second (total 5min 1sec)
      expect(cache.get('key')).toBeNull()
    })
  })
})