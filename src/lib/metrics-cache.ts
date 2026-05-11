/**
 * Metrics cache module.
 * Re-exports from ttl-cache.ts for backward compatibility.
 * For new code, use TTLCache directly from ttl-cache.ts.
 */

// Re-export the generic TTLCache
export { TTLCache } from './ttl-cache'

// Import for internal use
import { TTLCache } from './ttl-cache'

// TTL de 30 segundos como especifica el proposal original
const METRICS_CACHE_TTL_MS = 30 * 1000

// Singleton instance for metrics caching (30s TTL)
const metricsCache = new TTLCache<unknown>(METRICS_CACHE_TTL_MS)

/**
 * Generates a cache key based on request parameters
 */
export function getMetricsCacheKey(
  pharmacyIds: string[],
  userRole: string,
  isActiveFilter?: boolean
): string {
  const ids = [...pharmacyIds].sort().join(',')
  return `${userRole}:${isActiveFilter ?? 'all'}:${ids}`
}

export { metricsCache }