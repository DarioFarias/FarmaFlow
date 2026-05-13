import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFilteredPharmacies } from '../pharmacies'

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: class ObjectId {
        constructor(id?: string) {
          this.id = id || 'mock-id'
        }
        toString() {
          return this.id
        }
      },
    },
  },
}))

// Mock MongoDB connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

// Mock models
vi.mock('@/models/Pharmacy', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

vi.mock('@/models/SupplyRequest', () => ({
  default: {
    aggregate: vi.fn(),
  },
}))

vi.mock('@/models/Expense', () => ({
  default: {
    aggregate: vi.fn(),
  },
}))

vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}))

// Mock metrics-cache
vi.mock('@/lib/metrics-cache', () => ({
  metricsCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  },
  getMetricsCacheKey: vi.fn().mockReturnValue('mock-key'),
}))

describe('getFilteredPharmacies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return paginated pharmacy metrics', async () => {
    // Arrange
    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Farmacia 1',
        address: 'Address 1',
        phone: '123456',
        email: 'test1@farmacia.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const Pharmacy = (await import('@/models/Pharmacy')).default
    const mockFind = Pharmacy.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockPharmacies),
            }),
          }),
        }),
      }),
    })
    ;(Pharmacy.countDocuments as any).mockResolvedValue(1)

    // Mock aggregations
    const SupplyRequest = (await import('@/models/SupplyRequest')).default
    ;(SupplyRequest.aggregate as any).mockResolvedValue([
      { pendingSupply: [], deliveredOrders: [] },
    ])

    const Expense = (await import('@/models/Expense')).default
    ;(Expense.aggregate as any).mockResolvedValue([
      { pendingExpenses: [], monthlyExpenses: [] },
    ])

    // Act
    const result = await getFilteredPharmacies()

    // Assert
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('page')
    expect(result).toHaveProperty('totalPages')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].pharmacyName).toBe('Farmacia 1')
  })

  it('should filter by search term', async () => {
    // Arrange
    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Farmacia Central',
        address: 'Address 1',
        phone: '123456',
        email: 'test1@farmacia.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const Pharmacy = (await import('@/models/Pharmacy')).default
    ;(Pharmacy.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockPharmacies),
            }),
          }),
        }),
      }),
    })
    ;(Pharmacy.countDocuments as any).mockResolvedValue(1)

    // Mock aggregations
    const SupplyRequest = (await import('@/models/SupplyRequest')).default
    ;(SupplyRequest.aggregate as any).mockResolvedValue([
      { pendingSupply: [], deliveredOrders: [] },
    ])

    const Expense = (await import('@/models/Expense')).default
    ;(Expense.aggregate as any).mockResolvedValue([
      { pendingExpenses: [], monthlyExpenses: [] },
    ])

    // Act
    const result = await getFilteredPharmacies('Central', undefined, 'name-asc', 1, 20)

    // Assert - the search should be applied in the pharmacy query
    expect(Pharmacy.find).toHaveBeenCalled()
    const callArgs = (Pharmacy.find as any).mock.calls[0][0]
    expect(callArgs).toHaveProperty('pharmacyName')
  })

  it('should filter by active status', async () => {
    // Arrange
    const Pharmacy = (await import('@/models/Pharmacy')).default
    ;(Pharmacy.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    ;(Pharmacy.countDocuments as any).mockResolvedValue(0)

    // Mock aggregations
    const SupplyRequest = (await import('@/models/SupplyRequest')).default
    ;(SupplyRequest.aggregate as any).mockResolvedValue([
      { pendingSupply: [], deliveredOrders: [] },
    ])

    const Expense = (await import('@/models/Expense')).default
    ;(Expense.aggregate as any).mockResolvedValue([
      { pendingExpenses: [], monthlyExpenses: [] },
    ])

    // Act
    const result = await getFilteredPharmacies(undefined, true, 'name-asc', 1, 20)

    // Assert - the isActive filter should be applied
    expect(Pharmacy.find).toHaveBeenCalled()
    const callArgs = (Pharmacy.find as any).mock.calls[0][0]
    expect(callArgs).toHaveProperty('isActive', true)
  })

  it('should filter by assigned pharmacies for SUPERVISOR role', async () => {
    // Arrange
    const Pharmacy = (await import('@/models/Pharmacy')).default
    ;(Pharmacy.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    ;(Pharmacy.countDocuments as any).mockResolvedValue(0)

    // Mock aggregations
    const SupplyRequest = (await import('@/models/SupplyRequest')).default
    ;(SupplyRequest.aggregate as any).mockResolvedValue([
      { pendingSupply: [], deliveredOrders: [] },
    ])

    const Expense = (await import('@/models/Expense')).default
    ;(Expense.aggregate as any).mockResolvedValue([
      { pendingExpenses: [], monthlyExpenses: [] },
    ])

    // Act
    const result = await getFilteredPharmacies(
      undefined,
      undefined,
      'name-asc',
      1,
      20,
      'SUPERVISOR',
      ['pharm-1', 'pharm-2']
    )

    // Assert - the SUPERVISOR should have _id filter
    expect(Pharmacy.find).toHaveBeenCalled()
    const callArgs = (Pharmacy.find as any).mock.calls[0][0]
    expect(callArgs).toHaveProperty('_id')
    expect(callArgs._id).toHaveProperty('$in')
  })

  it('should NOT filter by assigned pharmacies for ADMIN role', async () => {
    // Arrange
    const Pharmacy = (await import('@/models/Pharmacy')).default
    ;(Pharmacy.find as any).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    ;(Pharmacy.countDocuments as any).mockResolvedValue(0)

    // Mock aggregations
    const SupplyRequest = (await import('@/models/SupplyRequest')).default
    ;(SupplyRequest.aggregate as any).mockResolvedValue([
      { pendingSupply: [], deliveredOrders: [] },
    ])

    const Expense = (await import('@/models/Expense')).default
    ;(Expense.aggregate as any).mockResolvedValue([
      { pendingExpenses: [], monthlyExpenses: [] },
    ])

    // Act
    const result = await getFilteredPharmacies(
      undefined,
      undefined,
      'name-asc',
      1,
      20,
      'ADMIN',
      ['pharm-1', 'pharm-2']
    )

    // Assert - ADMIN should NOT have _id filter
    expect(Pharmacy.find).toHaveBeenCalled()
    const callArgs = (Pharmacy.find as any).mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('_id')
  })

  it('should return empty array when SUPERVISOR has no assigned pharmacies', async () => {
    // Arrange
    const Pharmacy = (await import('@/models/Pharmacy')).default

    // Act
    const result = await getFilteredPharmacies(
      undefined,
      undefined,
      'name-asc',
      1,
      20,
      'SUPERVISOR',
      []
    )

    // Assert - should return empty
    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(Pharmacy.find).not.toHaveBeenCalled()
  })
})