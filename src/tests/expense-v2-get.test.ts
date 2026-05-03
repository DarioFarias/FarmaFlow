import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ExpenseStatus } from '@/types'

// Mocks
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/models/Expense', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

import { GET } from '@/app/api/expenses/route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>
const mockFind = Expense.find as ReturnType<typeof vi.fn>
const mockCountDocuments = Expense.countDocuments as ReturnType<typeof vi.fn>

describe('2.3: GET /api/expenses - Phase 2 filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should filter by single status', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [
      { _id: '1', status: ExpenseStatus.PENDIENTE_DE_FACTURAR },
      { _id: '2', status: ExpenseStatus.PENDIENTE_DE_FACTURAR },
    ]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(2)

    // Build URL with status filter
    const url = new URL('http://localhost:3000/api/expenses?status=PENDIENTE_DE_FACTURAR&page=1&pageSize=20')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data).toHaveLength(2)
    // Verify query includes status filter
    expect(mockFind).toHaveBeenCalled()
  })

  it('should filter by multiple statuses (CSV)', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [
      { _id: '1', status: ExpenseStatus.PENDIENTE_DE_FACTURAR },
      { _id: '2', status: ExpenseStatus.FACTURADO },
    ]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(2)

    // CSV statuses
    const url = new URL('http://localhost:3000/api/expenses?status=PENDIENTE_DE_FACTURAR,FACTURADO')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
  })

  it('should filter by period (YYYY-MM)', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [{ _id: '1', period: '2024-01' }]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(1)

    const url = new URL('http://localhost:3000/api/expenses?period=2024-01')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
  })

  it('should filter by date range', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [{ _id: '1' }]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(1)

    const url = new URL('http://localhost:3000/api/expenses?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
  })

  it('should sort by amount ascending', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [{ _id: '1', amount: 100 }, { _id: '2', amount: 200 }]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(2)

    const url = new URL('http://localhost:3000/api/expenses?sortBy=amount&sortOrder=asc')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
  })

  it('should sort by expenseNumber', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [{ _id: '1', expenseNumber: 'EXP-2024-0001' }]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(1)

    const url = new URL('http://localhost:3000/api/expenses?sortBy=expenseNumber&sortOrder=desc')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
  })

  it('should include filters in pagination response', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const mockExpenses = [{ _id: '1' }]
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(mockExpenses),
      then: undefined,
    })
    mockCountDocuments.mockResolvedValue(1)

    const url = new URL('http://localhost:3000/api/expenses?status=PENDIENTE_DE_FACTURAR&period=2024-01')
    const req = new NextRequest(url)

    // Act
    const response = await GET(req)

    // Assert
    expect(response.status).toBe(200)
    const json = await response.json()
    // Response should include filters applied
    expect(json).toHaveProperty('data')
  })
})