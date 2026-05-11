import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { UserRole } from '@/types'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock mongoose
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

// Mock Expense model - use factory function
vi.mock('@/models/Expense', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

// Mock Pharmacy model
vi.mock('@/models/Pharmacy', () => ({
  default: {
    find: vi.fn(),
  },
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'
import Pharmacy from '@/models/Pharmacy'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('GET /api/expenses - Pharmacy Cache (REQ-PERF-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cache miss scenario - first request for SUPERVISOR', () => {
    it('should call Pharmacy.find on cache miss', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: UserRole.SUPERVISOR,
          assignedPharmacies: ['pharm-001', 'pharm-002'],
        },
      })

      const mockPharmacies = [
        { _id: { toString: () => 'pharm-001' } },
        { _id: { toString: () => 'pharm-002' } },
      ]
      vi.mocked(Pharmacy.find).mockResolvedValue(mockPharmacies as any)
      
      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/expenses')
      await GET(req)

      // Should call Pharmacy.find (cache miss)
      expect(Pharmacy.find).toHaveBeenCalledTimes(1)
      expect(Pharmacy.find).toHaveBeenCalledWith({
        _id: { $in: ['pharm-001', 'pharm-002'] },
        isActive: true,
      })
    })
  })

  describe('Non-cache users', () => {
    it('should NOT call Pharmacy.find for ADMIN users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          role: UserRole.ADMIN,
          assignedPharmacies: [],
        },
      })

      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/expenses')
      await GET(req)

      // Pharmacy.find should never be called for ADMIN
      expect(Pharmacy.find).not.toHaveBeenCalled()
    })

    it('should NOT call Pharmacy.find for SUPER_ADMIN users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super-admin-123',
          role: UserRole.SUPER_ADMIN,
          assignedPharmacies: [],
        },
      })

      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/expenses')
      await GET(req)

      // Pharmacy.find should never be called for SUPER_ADMIN
      expect(Pharmacy.find).not.toHaveBeenCalled()
    })
  })

  describe('Response structure', () => {
    it('should return expenses with correct pagination structure', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          role: UserRole.ADMIN,
          assignedPharmacies: [],
        },
      })

      const mockExpenses = [
        { _id: 'exp-1', expenseNumber: 'EXP-001', description: 'Test' },
      ]
      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue(mockExpenses),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(1)

      const req = new NextRequest('http://localhost:3000/api/expenses?page=1&pageSize=10')
      const response = await GET(req)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toHaveProperty('data')
      expect(json).toHaveProperty('total')
      expect(json).toHaveProperty('page')
      expect(json).toHaveProperty('totalPages')
      expect(json.total).toBe(1)
      expect(json.data).toHaveLength(1)
    })
  })

  describe('Query parameters', () => {
    it('should default to page 1 and pageSize 20', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          role: UserRole.ADMIN,
          assignedPharmacies: [],
        },
      })

      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/expenses')
      const response = await GET(req)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.page).toBe(1)
    })
  })

  describe('Empty assignedPharmacies', () => {
    it('should return empty results for SUPERVISOR without pharmacies', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: UserRole.SUPERVISOR,
          assignedPharmacies: [], // Empty - no access to any pharmacy
        },
      })

      vi.mocked(Expense.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)
      vi.mocked(Expense.countDocuments).mockResolvedValue(0)

      const req = new NextRequest('http://localhost:3000/api/expenses')
      const response = await GET(req)
      
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data).toHaveLength(0)
      
      // Should not call Pharmacy.find for empty assignedPharmacies
      expect(Pharmacy.find).not.toHaveBeenCalled()
    })
  })
})