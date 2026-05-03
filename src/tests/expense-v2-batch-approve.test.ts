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

import { POST } from '@/app/api/expenses/batch-approve/route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>
const mockFindById = Expense.findById as ReturnType<typeof vi.fn>
const mockFindByIdAndUpdate = Expense.findByIdAndUpdate as ReturnType<typeof vi.fn>

describe('2.5: POST /api/expenses/batch-approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should approve PENDIENTE_DE_FACTURAR expenses (requires pdf + xml)', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // First expense has full invoice
    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      pdfUrl: 'https://cloud.com/pdf/1.pdf',
      xmlUrl: 'https://cloud.com/xml/1.xml',
    }

    mockFindById.mockResolvedValue(expense1)
    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.FACTURADO })

    const body = {
      expenseIds: ['expense-1'],
      notes: 'Aprobado en lote',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
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
    expect(json.data.processed).toBe(1)
  })

  it('should reject PENDIENTE_DE_FACTURAR without full invoice', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // Expense missing xmlUrl
    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      pdfUrl: 'https://cloud.com/pdf/1.pdf',
      // Missing xmlUrl
    }

    mockFindById.mockResolvedValue(expense1)

    const body = {
      expenseIds: ['expense-1'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.failed).toBe(1)
    expect(json.data.results[0].error).toContain('Falta')
  })

  it('should report FACTURADO expenses to accounting', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.FACTURADO,
    }

    mockFindById.mockResolvedValue(expense1)
    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.REPORTED })

    const body = {
      expenseIds: ['expense-1'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
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
  })

  it('should reject non-supervisor users', async () => {
    // Arrange
    const mockSession = {
      user: { id: 'user-1', role: 'VENDEDOR' },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const body = { expenseIds: ['expense-1'] }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch-approve', {
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