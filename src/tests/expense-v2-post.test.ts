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
    create: vi.fn(),
  },
}))

vi.mock('@/models/Pharmacy', () => ({
  default: {
    findOne: vi.fn(),
  },
}))

import { POST } from '@/app/api/expenses/route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'
import Pharmacy from '@/models/Pharmacy'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('2.2: POST /api/expenses - Phase 2 status logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set status PENDIENTE_DE_FACTURAR when no invoice provided', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
        role: 'SUPERVISOR',
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Central',
      isActive: true,
    })

    // Capture the created expense
    let capturedExpense: any = null
    vi.mocked(Expense.create).mockImplementation((data: any) => {
      capturedExpense = data
      return Promise.resolve({
        _id: 'expense-id-new',
        expenseNumber: 'EXP-2024-0001',
        ...data,
      })
    })

    const body = {
      amount: 1500,
      currency: 'MXN',
      description: 'Gasto simple sin factura',
      receiptDate: '2024-01-15T00:00:00.000Z',
      pharmacyId: 'PHARM-001',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(201)
    expect(capturedExpense).toBeDefined()
    expect(capturedExpense.status).toBe(ExpenseStatus.PENDIENTE_DE_FACTURAR)
  })

  it('should set status FACTURADO when pdfUrl and xmlUrl provided', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
        role: 'SUPERVISOR',
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Central',
      isActive: true,
    })

    let capturedExpense: any = null
    vi.mocked(Expense.create).mockImplementation((data: any) => {
      capturedExpense = data
      return Promise.resolve({
        _id: 'expense-id-new',
        expenseNumber: 'EXP-2024-0002',
        ...data,
      })
    })

    const body = {
      amount: 2500,
      currency: 'MXN',
      description: 'Gasto con CFDI completo',
      receiptDate: '2024-01-15T00:00:00.000Z',
      pharmacyId: 'PHARM-001',
      pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
      pdfPublicId: 'expenses/test',
      xmlUrl: 'https://cloudinary.com/xml/test.xml',
      xmlPublicId: 'expenses/test',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(201)
    expect(capturedExpense).toBeDefined()
    expect(capturedExpense.status).toBe(ExpenseStatus.FACTURADO)
  })

  it('should set status PENDIENTE_DE_FACTURAR when only pdfUrl (incomplete invoice)', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
        role: 'SUPERVISOR',
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Central',
      isActive: true,
    })

    let capturedExpense: any = null
    vi.mocked(Expense.create).mockImplementation((data: any) => {
      capturedExpense = data
      return Promise.resolve({
        _id: 'expense-id-new',
        expenseNumber: 'EXP-2024-0003',
        ...data,
      })
    })

    // Only pdfUrl, no xmlUrl
    const body = {
      amount: 1000,
      currency: 'MXN',
      description: 'Gasto con PDF parcial',
      receiptDate: '2024-01-15T00:00:00.000Z',
      pharmacyId: 'PHARM-001',
      pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
      pdfPublicId: 'expenses/test',
      // No xmlUrl
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(201)
    expect(capturedExpense.status).toBe(ExpenseStatus.PENDIENTE_DE_FACTURAR)
  })

  it('should set status PENDIENTE_DE_FACTURAR when only xmlUrl (incomplete invoice)', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
        role: 'SUPERVISOR',
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Central',
      isActive: true,
    })

    let capturedExpense: any = null
    vi.mocked(Expense.create).mockImplementation((data: any) => {
      capturedExpense = data
      return Promise.resolve({
        _id: 'expense-id-new',
        expenseNumber: 'EXP-2024-0004',
        ...data,
      })
    })

    // Only xmlUrl, no pdfUrl
    const body = {
      amount: 1000,
      currency: 'MXN',
      description: 'Gasto con XML parcial',
      receiptDate: '2024-01-15T00:00:00.000Z',
      pharmacyId: 'PHARM-001',
      xmlUrl: 'https://cloudinary.com/xml/test.xml',
      xmlPublicId: 'expenses/test',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(201)
    expect(capturedExpense.status).toBe(ExpenseStatus.PENDIENTE_DE_FACTURAR)
  })
})