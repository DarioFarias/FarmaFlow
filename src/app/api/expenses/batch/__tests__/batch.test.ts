import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ExpenseStatus, UserRole } from '@/types'

const { mockGetServerSession, mockIsAdmin, mockFindById, mockFindByIdAndUpdate } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockIsAdmin: vi.fn(),
  mockFindById: vi.fn(),
  mockFindByIdAndUpdate: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/roles', () => ({
  isAdmin: mockIsAdmin,
}))

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/models/Expense', () => ({
  default: {
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}))

import { POST } from '../route'

describe('POST /api/expenses/batch (unified)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockReset()
    mockIsAdmin.mockImplementation((role?: UserRole) => {
      console.log('[DEBUG] isAdmin called with role:', role, 'UserRole.ADMIN:', UserRole.ADMIN)
      return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR
    })
  })

  // =============================================
  // AUTH TESTS
  // =============================================

  it('should return 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const body = { action: 'approve', expenseIds: ['expense-1'] }
    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('should return 403 when user is VENDEDOR', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'VENDEDOR' },
    })

    const body = { action: 'approve', expenseIds: ['expense-1'] }
    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)
    console.log('[TEST] Response status:', response.status)
    const json = await response.json()
    console.log('[TEST] Response body:', JSON.stringify(json))
    expect(response.status).toBe(403)
  })

  // =============================================
  // APPROVE ACTION TESTS
  // =============================================

  it('should approve PENDIENTE_DE_FACTURAR expenses (requires pdf + xml)', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      pdfUrl: 'https://cloud.com/pdf/1.pdf',
      xmlUrl: 'https://cloud.com/xml/1.xml',
    }

    mockFindById.mockResolvedValue(expense1)
    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.FACTURADO })

    const body = {
      action: 'approve',
      expenseIds: ['expense-1'],
      notes: 'Aprobado en lote',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.processed).toBe(1)
    expect(json.data.results[0].success).toBe(true)
  })

  it('should fail approval for PENDIENTE_DE_FACTURAR without pdfUrl/xmlUrl', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      pdfUrl: 'https://cloud.com/pdf/1.pdf',
    }

    mockFindById.mockResolvedValue(expense1)

    const body = {
      action: 'approve',
      expenseIds: ['expense-1'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.failed).toBe(1)
    expect(json.data.results[0].error).toContain('Falta')
  })

  // =============================================
  // REPORT ACTION TESTS
  // =============================================

  it('should report FACTURADO expenses with period', async () => {
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
      action: 'report',
      expenseIds: ['expense-1'],
      period: '2024-01',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.processed).toBe(1)
  })

  it('should reject report without period (validation error)', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const body = {
      action: 'report',
      expenseIds: ['expense-1'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('should fail report if any expense is not FACTURADO (atomic)', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = { _id: 'expense-1', status: ExpenseStatus.FACTURADO }
    const expense2 = { _id: 'expense-2', status: ExpenseStatus.PENDIENTE_DE_FACTURAR }

    // Set up mock to return different expenses for different calls
    let callIndex = 0
    mockFindById.mockImplementation((id: string) => {
      const expenses = [expense1, expense2]
      return Promise.resolve(expenses[callIndex++] || null)
    })

    const body = {
      action: 'report',
      expenseIds: ['expense-1', 'expense-2'],
      period: '2024-01',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  // =============================================
  // RETURN ACTION TESTS
  // =============================================

  it('should return REPORTED expenses to PENDIENTE_DE_PAGO', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = {
      _id: 'expense-1',
      status: ExpenseStatus.REPORTED,
    }

    mockFindById.mockResolvedValue(expense1)
    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.PENDIENTE_DE_PAGO })

    const body = {
      action: 'return',
      expenseIds: ['expense-1'],
      notes: 'Devuelto para pago',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.processed).toBe(1)
  })

  it('should allow partial success for return (one REPORTED, one not)', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const expense1 = { _id: 'expense-1', status: ExpenseStatus.REPORTED }
    const expense2 = { _id: 'expense-2', status: ExpenseStatus.FACTURADO }

    // Set up mock to return different expenses for different calls
    let callIndex = 0
    mockFindById.mockImplementation(() => {
      const expenses = [expense1, expense2]
      return Promise.resolve(expenses[callIndex++] || null)
    })

    mockFindByIdAndUpdate.mockResolvedValue({ ...expense1, status: ExpenseStatus.PENDIENTE_DE_PAGO })

    const body = {
      action: 'return',
      expenseIds: ['expense-1', 'expense-2'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data.processed).toBe(1)
    expect(json.data.failed).toBe(1)
  })

  // =============================================
  // EDGE CASES
  // =============================================

  it('should reject invalid action', async () => {
    const mockSession = {
      user: { id: 'supervisor-1', role: 'SUPERVISOR', assignedPharmacies: [] },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const body = {
      action: 'pay',
      expenseIds: ['expense-1'],
    }

    const req = new NextRequest('http://localhost:3000/api/expenses/batch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })
})