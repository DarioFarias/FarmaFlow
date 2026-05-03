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

vi.mock('@/lib/roles', () => ({
  isAdmin: vi.fn((role) => role === 'ADMIN' || role === 'SUPERVISOR'),
}))

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/models/Expense', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}))

import { POST } from '@/app/api/expenses/batch-report/route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>
const mockFindById = Expense.findById as ReturnType<typeof vi.fn>
const mockFindByIdAndUpdate = Expense.findByIdAndUpdate as ReturnType<typeof vi.fn>

describe('2.6: POST /api/expenses/batch-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should report FACTURADO expenses to accounting with period', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.FACTURADO,
      pdfUrl: 'https://cloud.com/pdf/1.pdf',
      xmlUrl: 'https://cloud.com/xml/1.xml',
    }

    mockFindById.mockResolvedValue(expense1)
    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.REPORTED })

    const body = {
      expenseIds: ['expense-1'],
      period: '2024-01',
      notes: 'Reporte mensual',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.period).toBe('2024-01')
  })

  it('should reject non-FACTURADO expenses', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // Expense is PENDIENTE_DE_FACTURAR, not FACTURADO
    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
    }

    mockFindById.mockResolvedValue(expense1)

    const body = {
      expenseIds: ['expense-1'],
      period: '2024-01',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('should require supervisor role', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'user-1', role: 'VENDEDOR' },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const body = {
      expenseIds: ['expense-1'],
      period: '2024-01',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-report', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(403)
  })
})