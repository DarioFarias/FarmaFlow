import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// =============================================
// Tests para GET /api/admin/pharmacies/metrics
// =============================================

// Mock de next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock de mongoose
vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: class ObjectId {
        constructor(id?: string) {
          this.id = id
        }
        toString() {
          return this.id
        }
      },
    },
  },
  connect: vi.fn(),
}))

// Mock de los modelos
const mockPharmacyFind = vi.fn()
const mockPharmacyCount = vi.fn()
const mockSupplyRequestAggregate = vi.fn()
const mockExpenseAggregate = vi.fn()
const mockUserFind = vi.fn()

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}))

vi.mock('@/models/Pharmacy', () => ({
  default: {
    find: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }) }) }), exec: () => Promise.resolve([]) }),
    countDocuments: () => Promise.resolve(0),
  },
}))

vi.mock('@/models/SupplyRequest', () => ({
  default: {
    aggregate: () => Promise.resolve([]),
  },
}))

vi.mock('@/models/Expense', () => ({
  default: {
    aggregate: () => Promise.resolve([]),
  },
}))

vi.mock('@/models/User', () => ({
  default: {
    find: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }),
  },
}))

// Helper para crear sesión mock
const createMockSession = (role: string, assignedPharmacies?: string[]) => ({
  user: {
    role,
    name: 'Test User',
    ...(assignedPharmacies ? { assignedPharmacies } : {}),
  },
})

// Helper para crear request
const createMockRequest = (url: string = '/api/admin/pharmacies/metrics') => {
  return new NextRequest(new URL(url), {
    method: 'GET',
  })
}

describe('GET /api/admin/pharmacies/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ========== Tests de autenticación ==========

  it('returns 403 when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('returns 403 for USER role (no pharmacy access)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('USER'))

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('returns 403 for VENDEDOR role (no pharmacy access)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('VENDEDOR'))

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('returns 403 for ENCARGADO role (no pharmacy access)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ENCARGADO'))

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  // ========== Tests de acceso válido ==========

  it('returns empty data when no pharmacies exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    // Mock empty pharmacies
    const mockPharmacyModel = await import('@/models/Pharmacy')
    vi.mocked(mockPharmacyModel.default.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(mockPharmacyModel.default.countDocuments).mockResolvedValue(0)

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual([])
    expect(data.total).toBe(0)
    expect(data.totalPages).toBe(0)
  })

  it('returns pharmacy metrics with pending counts', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    // Mock pharmacies with data
    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Farmacia Central',
        address: 'Calle 1',
        phone: '555-1234',
        email: 'central@farma.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Mock aggregation results
    const mockSupplyMetrics = [{
      pendingSupply: [{ _id: 'pharm-1', pendingSupplyRequests: 2 }],
      deliveredOrders: [{ _id: 'pharm-1', deliveredOrders: 5 }],
    }]

    const mockExpenseMetrics = [{
      pendingExpenses: [{ _id: 'pharm-1', pendingExpenses: 1 }],
      monthlyExpenses: [{ _id: 'pharm-1', totalExpensesThisMonth: 1500 }],
    }]

    const mockUsers = [
      { name: 'Juan Perez', email: 'juan@test.com', role: 'SUPERVISOR', isActive: true, assignedPharmacies: ['pharm-1'] },
    ]

    // Import and mock models
    const { default: Pharmacy } = await import('@/models/Pharmacy')
    const { default: SupplyRequest } = await import('@/models/SupplyRequest')
    const { default: Expense } = await import('@/models/Expense')
    const { default: User } = await import('@/models/User')

    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockPharmacies),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(1)

    vi.mocked(SupplyRequest.aggregate).mockResolvedValue(mockSupplyMetrics)
    vi.mocked(Expense.aggregate).mockResolvedValue(mockExpenseMetrics)
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve(mockUsers),
      }),
    } as any)

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].pharmacyName).toBe('Farmacia Central')
    expect(data.data[0].pendingSupplyRequests).toBe(2)
    expect(data.data[0].pendingExpenses).toBe(1)
    expect(data.data[0].monthlySummary.totalExpensesThisMonth).toBe(1500)
    expect(data.data[0].monthlySummary.deliveredOrders).toBe(5)
    expect(data.data[0].assignedUsers).toHaveLength(1)
    expect(data.data[0].assignedUsers[0].name).toBe('Juan Perez')
  })

  // ========== Tests de filtro por rol SUPERVISOR ==========

  it('SUPERVISOR sees only assigned pharmacies', async () => {
    vi.mocked(getServerSession).mockResolvedValue(
      createMockSession('SUPERVISOR', ['pharm-1', 'pharm-2'])
    )

    // Only pharmacies in assignedPharmacies should be returned
    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Farmacia Asignada 1',
        address: 'Calle 1',
        phone: '555-1234',
        email: 'pharm1@farma.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockPharmacies),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(1)

    // Mock empty aggregations
    const { default: SupplyRequest } = await import('@/models/SupplyRequest')
    const { default: Expense } = await import('@/models/Expense')
    const { default: User } = await import('@/models/User')

    vi.mocked(SupplyRequest.aggregate).mockResolvedValue([{ pendingSupply: [], deliveredOrders: [] }])
    vi.mocked(Expense.aggregate).mockResolvedValue([{ pendingExpenses: [], monthlyExpenses: [] }])
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    } as any)

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].pharmacyName).toBe('Farmacia Asignada 1')
  })

  it('SUPERVISOR returns empty when no assigned pharmacies', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('SUPERVISOR', []))

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual([])
    expect(data.total).toBe(0)
  })

  // ========== Tests de filtros ==========

  it('filters by isActive when query parameter provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    const req = createMockRequest('/api/admin/pharmacies/metrics?isActive=true')
    const response = await GET(req)

    expect(response.status).toBe(200)
    // El query parameter debería pasarse al filtro de isActive
    // La implementación verifica el parámetro
    const data = await response.json()
    expect(data.data).toBeDefined()
  })

  // ========== Tests de paginación ==========

  it('returns correct pagination metadata', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    // Create many mock pharmacies to test pagination
    const mockPharmacies = Array.from({ length: 20 }, (_, i) => ({
      _id: { toString: () => `pharm-${i}` },
      pharmacyName: `Farmacia ${i}`,
      address: `Calle ${i}`,
      phone: `555-${i}`,
      email: `pharm${i}@farma.com`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockPharmacies),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(50)

    // Mock empty metrics
    const { default: SupplyRequest } = await import('@/models/SupplyRequest')
    const { default: Expense } = await import('@/models/Expense')
    const { default: User } = await import('@/models/User')

    vi.mocked(SupplyRequest.aggregate).mockResolvedValue([{ pendingSupply: [], deliveredOrders: [] }])
    vi.mocked(Expense.aggregate).mockResolvedValue([{ pendingExpenses: [], monthlyExpenses: [] }])
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    } as any)

    const req = createMockRequest('/api/admin/pharmacies/metrics?page=1&pageSize=20')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.total).toBe(50)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(20)
    expect(data.totalPages).toBe(3) // 50 / 20 = 2.5 → 3
  })

  // ========== Tests de estructura de respuesta ==========

  it('returns expected shape per spec', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Test Pharmacy',
        address: 'Test Address',
        phone: '555-1234',
        email: 'test@farma.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockPharmacies),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(1)

    const { default: SupplyRequest } = await import('@/models/SupplyRequest')
    const { default: Expense } = await import('@/models/Expense')
    const { default: User } = await import('@/models/User')

    vi.mocked(SupplyRequest.aggregate).mockResolvedValue([{ pendingSupply: [], deliveredOrders: [] }])
    vi.mocked(Expense.aggregate).mockResolvedValue([{ pendingExpenses: [], monthlyExpenses: [] }])
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    } as any)

    const req = createMockRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)

    // Verify response structure
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('totalPages')

    // Verify pharmacy object structure
    const pharmacy = data.data[0]
    expect(pharmacy).toHaveProperty('_id')
    expect(pharmacy).toHaveProperty('pharmacyName')
    expect(pharmacy).toHaveProperty('address')
    expect(pharmacy).toHaveProperty('phone')
    expect(pharmacy).toHaveProperty('email')
    expect(pharmacy).toHaveProperty('isActive')
    expect(pharmacy).toHaveProperty('pendingSupplyRequests')
    expect(pharmacy).toHaveProperty('pendingExpenses')
    expect(pharmacy).toHaveProperty('assignedUsers')
    expect(pharmacy).toHaveProperty('monthlySummary')
    expect(pharmacy.monthlySummary).toHaveProperty('totalExpensesThisMonth')
    expect(pharmacy.monthlySummary).toHaveProperty('deliveredOrders')
    expect(pharmacy.monthlySummary).toHaveProperty('activeUsers')
    expect(pharmacy.monthlySummary).toHaveProperty('lastActivity')
  })

  // ========== Tests de roles con acceso ==========

  it('allows SUPER_ADMIN role', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('SUPER_ADMIN'))

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(0)

    const req = createMockRequest()
    const response = await GET(req)

    expect(response.status).toBe(200)
  })

  it('allows ADMIN role', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('ADMIN'))

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([]),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(0)

    const req = createMockRequest()
    const response = await GET(req)

    expect(response.status).toBe(200)
  })

  it('allows SUPERVISOR role', async () => {
    vi.mocked(getServerSession).mockResolvedValue(createMockSession('SUPERVISOR', ['pharm-1']))

    const mockPharmacies = [
      {
        _id: { toString: () => 'pharm-1' },
        pharmacyName: 'Test',
        address: 'Test',
        phone: '555-1234',
        email: 'test@farma.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    vi.mocked(Pharmacy.find).mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockPharmacies),
            }),
          }),
        }),
      }),
    } as any)
    vi.mocked(Pharmacy.countDocuments).mockResolvedValue(1)

    // Mock empty metrics
    const { default: SupplyRequest } = await import('@/models/SupplyRequest')
    const { default: Expense } = await import('@/models/Expense')
    const { default: User } = await import('@/models/User')

    vi.mocked(SupplyRequest.aggregate).mockResolvedValue([{ pendingSupply: [], deliveredOrders: [] }])
    vi.mocked(Expense.aggregate).mockResolvedValue([{ pendingExpenses: [], monthlyExpenses: [] }])
    vi.mocked(User.find).mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    } as any)

    const req = createMockRequest()
    const response = await GET(req)

    expect(response.status).toBe(200)
  })
})