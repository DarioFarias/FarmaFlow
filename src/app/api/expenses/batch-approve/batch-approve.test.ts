import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

// Mock Expense model - use factory to avoid hoisting issues
vi.mock('@/models/Expense', () => ({
  default: {
    find: vi.fn(),
    bulkWrite: vi.fn(),
  },
}))

// Import after mocks
import { PATCH } from './route'
import { ExpenseStatus } from '@/types'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('PATCH /api/expenses/batch-approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['id1'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(401)
    })

    it('should reject non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'USER' },
      })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['id1'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(403)
    })

    it('should accept SUPERVISOR role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'SUPERVISOR' },
      })
      vi.mocked(Expense.find).mockResolvedValue([])
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 0 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: [] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).not.toBe(403)
    })
  })

  describe('Validation', () => {
    it('should reject empty expenseIds array', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: [] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('expenseIds')
    })

    it('should reject missing expenseIds', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(400)
    })
  })

  describe('Valid batch operation - All expenses valid', () => {
    it('should approve all pending expenses with bulkWrite', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.PENDING },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.PENDING },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 2 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.modifiedCount).toBe(2)
      expect(json.processedResults).toHaveLength(2)
      
      // Verify bulkWrite was called with correct structure
      expect(Expense.bulkWrite).toHaveBeenCalledWith([
        expect.objectContaining({
          updateMany: expect.objectContaining({
            filter: { _id: { $in: expect.anything() } },
            update: expect.objectContaining({
              $set: expect.objectContaining({
                status: ExpenseStatus.APPROVED
              })
            })
          })
        })
      ])
    })

    it('should use find({$in}) for batch query', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      vi.mocked(Expense.find).mockResolvedValue([])
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 0 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['id1', 'id2', 'id3'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      await PATCH(req)

      // Verify find was called with $in filter
      expect(Expense.find).toHaveBeenCalledWith({
        _id: { $in: ['id1', 'id2', 'id3'] }
      })
    })
  })

  describe('Partial failure - Some IDs invalid', () => {
    it('should report not found IDs in partialErrors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      // Only exp1 exists
      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.PENDING },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 1 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2', 'exp3'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      
      // exp2 and exp3 were not found
      const notFoundErrors = json.partialErrors?.filter(
        (e: { reason: string }) => e.reason.includes('no encontrado')
      )
      expect(notFoundErrors).toHaveLength(2)
      expect(notFoundErrors?.map((e: { id: string }) => e.id)).toContain('exp2')
      expect(notFoundErrors?.map((e: { id: string }) => e.id)).toContain('exp3')
    })

    it('should report invalid status in partialErrors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      // exp1 is PENDING (valid), exp2 is APPROVED (invalid for approval)
      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.PENDING },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.APPROVED },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 1 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      
      // exp2 is not PENDING
      const statusErrors = json.partialErrors?.filter(
        (e: { reason: string }) => e.reason.includes('PENDING')
      )
      expect(statusErrors).toHaveLength(1)
      expect(statusErrors?.[0].id).toBe('exp2')
    })

    it('should still process valid expenses when some are invalid', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      // Mix of valid and invalid
      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.PENDING },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.REVIEWED },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 1 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      
      expect(json.modifiedCount).toBe(1)
      expect(json.processedResults).toHaveLength(1)
      expect(json.processedResults?.[0].id).toBe('exp1')
    })
  })
})