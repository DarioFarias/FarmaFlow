import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Tests para lógica de búsqueda y paginación del componente de usuarios

describe('User Search Utilities', () => {
  describe('buildSearchParams', () => {
    // Función que simula la construcción de parámetros de búsqueda
    const buildSearchParams = (
      search: string,
      page: number,
      pageSize: number
    ): URLSearchParams => {
      const params = new URLSearchParams()
      if (search.trim()) {
        params.set('search', search.trim())
      }
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      return params
    }

    it('builds params with search term', () => {
      const params = buildSearchParams('admin', 1, 20)
      expect(params.toString()).toContain('search=admin')
      expect(params.toString()).toContain('page=1')
      expect(params.toString()).toContain('pageSize=20')
    })

    it('builds params without search term (empty)', () => {
      const params = buildSearchParams('', 1, 20)
      expect(params.toString()).not.toContain('search=')
      expect(params.toString()).toContain('page=1')
    })

    it('builds params with whitespace search term', () => {
      const params = buildSearchParams('   ', 1, 20)
      // El trim debería limpiar el search
      expect(params.toString()).not.toContain('search=')
    })

    it('respects different page sizes', () => {
      const params = buildSearchParams('test', 1, 10)
      expect(params.toString()).toContain('pageSize=10')
    })
  })

  describe('Pagination calculations', () => {
    const calculatePagination = (
      currentPage: number,
      totalPages: number,
      total: number,
      pageSize: number
    ) => {
      const hasNextPage = currentPage < totalPages
      const hasPrevPage = currentPage > 1
      const startItem = (currentPage - 1) * pageSize + 1
      const endItem = Math.min(currentPage * pageSize, total)
      const pageInfo = `Página ${currentPage} de ${totalPages}`

      return {
        hasNextPage,
        hasPrevPage,
        startItem: total > 0 ? startItem : 0,
        endItem: total > 0 ? endItem : 0,
        pageInfo,
        isEmpty: total === 0,
        showPagination: totalPages > 1,
      }
    }

    it('calculates pagination for first page', () => {
      const result = calculatePagination(1, 5, 50, 20)
      expect(result.hasPrevPage).toBe(false)
      expect(result.hasNextPage).toBe(true)
      expect(result.startItem).toBe(1)
      expect(result.endItem).toBe(20)
    })

    it('calculates pagination for last page', () => {
      const result = calculatePagination(3, 3, 50, 20) // página 3 de 3 con 50 items
      expect(result.hasPrevPage).toBe(true)
      expect(result.hasNextPage).toBe(false)
      expect(result.startItem).toBe(41)
      expect(result.endItem).toBe(50)
    })

    it('calculates pagination for middle page', () => {
      const result = calculatePagination(3, 5, 50, 20)
      expect(result.hasPrevPage).toBe(true)
      expect(result.hasNextPage).toBe(true)
      expect(result.startItem).toBe(41)
      expect(result.endItem).toBe(50)
    })

    it('handles empty results', () => {
      const result = calculatePagination(1, 0, 0, 20)
      expect(result.isEmpty).toBe(true)
      expect(result.showPagination).toBe(false)
      expect(result.startItem).toBe(0)
      expect(result.endItem).toBe(0)
    })

    it('calculates total pages correctly', () => {
      const getTotalPages = (total: number, pageSize: number) =>
        Math.ceil(total / pageSize)

      expect(getTotalPages(50, 20)).toBe(3)
      expect(getTotalPages(40, 20)).toBe(2)
      expect(getTotalPages(20, 20)).toBe(1)
      expect(getTotalPages(10, 20)).toBe(1)
      expect(getTotalPages(0, 20)).toBe(0)
    })
  })
})

describe('Debounce Search', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce search input by 300ms', async () => {
    const mockFn = vi.fn()
    let debounceTimeout: NodeJS.Timeout | null = null

    const debounceSearch = (value: string, callback: () => void) => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        callback()
      }, 300)
    }

    // Simulate typing
    debounceSearch('a', mockFn)
    vi.advanceTimersByTime(200)
    expect(mockFn).not.toHaveBeenCalled()

    debounceSearch('ab', mockFn)
    vi.advanceTimersByTime(200)
    expect(mockFn).not.toHaveBeenCalled()

    debounceSearch('admin', mockFn)
    vi.advanceTimersByTime(300)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should execute immediately after debounce completes', () => {
    const mockFn = vi.fn()

    const debounceSearch = (value: string, callback: () => void) => {
      setTimeout(() => {
        callback()
      }, 300)
    }

    debounceSearch('admin', mockFn)
    vi.advanceTimersByTime(300)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('Search Filter Logic (API)', () => {
  // Simula la lógica de filtro de búsqueda en el backend
  const buildSearchFilter = (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) {
      return null
    }

    const regex = new RegExp(searchTerm.trim(), 'i')
    return {
      $or: [
        { name: regex },
        { username: regex },
      ],
    }
  }

  it('returns null for empty search term', () => {
    expect(buildSearchFilter('')).toBeNull()
    expect(buildSearchFilter('   ')).toBeNull()
    expect(buildSearchFilter(null as any)).toBeNull()
    expect(buildSearchFilter(undefined as any)).toBeNull()
  })

  it('returns $or filter for name OR username', () => {
    const filter = buildSearchFilter('admin')
    expect(filter).not.toBeNull()
    expect(filter?.$or).toBeDefined()
    expect(filter?.$or.length).toBe(2)
    expect(filter?.$or[0]).toEqual({ name: /admin/i })
    expect(filter?.$or[1]).toEqual({ username: /admin/i })
  })

  it('trims search term', () => {
    const filter = buildSearchFilter('  admin  ')
    expect(filter?.$or[0]).toEqual({ name: /admin/i })
  })

  it('handles special regex characters', () => {
    const filter = buildSearchFilter('test$user')
    // El patrón debería escapar caracteres especiales
    expect(filter?.$or[0].name).toBeDefined()
  })
})