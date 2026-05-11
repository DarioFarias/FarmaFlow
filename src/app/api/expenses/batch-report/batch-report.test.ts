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

// Mock Expense model
vi.mock('@/models/Expense', () => ({
  default: {
    find: vi.fn(),
    bulkWrite: vi.fn(),
  },
}))

// Import after mocks
import { PATCH as batchReport } from './route'
import { PATCH as batchReturn } from '../batch-return/route'
import { ExpenseStatus } from '@/types'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('PATCH /api/expenses/batch-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Valid batch operation', () => {
    it('should mark approved expenses as REVIEWED using bulkWrite', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.APPROVED },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.APPROVED },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 2 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await batchReport(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.modifiedCount).toBe(2)
      
      // Verify bulkWrite was called with REVIEWED status
      expect(Expense.bulkWrite).toHaveBeenCalledWith([
        expect.objectContaining({
          updateMany: expect.objectContaining({
            update: expect.objectContaining({
              $set: expect.objectContaining({
                status: ExpenseStatus.REVIEWED
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

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['id1', 'id2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      await batchReport(req)

      expect(Expense.find).toHaveBeenCalledWith({
        _id: { $in: ['id1', 'id2'] }
      })
    })
  })

  describe('Partial failure', () => {
    it('should report expenses not in APPROVED status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      // exp1 is APPROVED (valid), exp2 is PENDING (invalid)
      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.APPROVED },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.PENDING },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 1 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await batchReport(req)
      const json = await response.json()
      
      // exp2 should be in partialErrors
      const statusErrors = json.partialErrors?.filter(
        (e: { reason: string }) => e.reason.includes('APPROVED')
      )
      expect(statusErrors).toHaveLength(1)
      expect(statusErrors?.[0].id).toBe('exp2')
      
      // But exp1 should still be processed
      expect(json.modifiedCount).toBe(1)
    })
  })
})

describe('PATCH /api/expenses/batch-return', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Valid batch operation', () => {
    it('should return APPROVED/REVIEWED expenses to PENDING using bulkWrite', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.APPROVED },
        { _id: { toString: () => 'exp2' }, status: ExpenseStatus.REVIEWED },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 2 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-return', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1', 'exp2'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await batchReturn(req)
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.modifiedCount).toBe(2)
      
      // Verify bulkWrite was called with PENDING status
      expect(Expense.bulkWrite).toHaveBeenCalledWith([
        expect.objectContaining({
          updateMany: expect.objectContaining({
            update: expect.objectContaining({
              $set: expect.objectContaining({
                status: ExpenseStatus.PENDING
              })
            })
          })
        })
      ])
    })
  })

  describe('Partial failure', () => {
    it('should reject PENDING expenses (cannot return to pending)', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const mockExpenses = [
        { _id: { toString: () => 'exp1' }, status: ExpenseStatus.PENDING },
      ]
      vi.mocked(Expense.find).mockResolvedValue(mockExpenses as any)
      vi.mocked(Expense.bulkWrite).mockResolvedValue({ modifiedCount: 0 })

      const req = new NextRequest('http://localhost:3000/api/expenses/batch-return', {
        method: 'PATCH',
        body: JSON.stringify({ expenseIds: ['exp1'] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await batchReturn(req)
      const json = await response.json()
      
      expect(json.partialErrors).toBeDefined()
      expect(json.partialErrors?.[0].reason).toContain('PENDING')
      expect(json.modifiedCount).toBe(0)
    })
  })
})