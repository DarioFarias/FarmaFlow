/**
 * Cache en memoria con TTL para métricas de farmacias
 * Implementación simple usando Map con timestamps
 */

// TTL de 30 segundos como especifica el proposal
const METRICS_CACHE_TTL_MS = 30 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Cache genérico con TTL para métricas
 */
class MetricsCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()

  /**
   * Obtiene un valor del cache si no ha expirado
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > METRICS_CACHE_TTL_MS) {
      // El cache expiró, eliminar entrada
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Establece un valor en el cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Invalida una entrada específica del cache
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtiene las claves actuales del cache (para debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Instancia singleton del cache de métricas
const metricsCache = new MetricsCache()

/**
 * Genera una clave de cache basada en los parámetros de la request
 */
export function getMetricsCacheKey(
  pharmacyIds: string[],
  userRole: string,
  isActiveFilter?: boolean
): string {
  const ids = [...pharmacyIds].sort().join(',')
  return `${userRole}:${isActiveFilter ?? 'all'}:${ids}`
}

export { metricsCache, MetricsCache }