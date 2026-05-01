import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock de next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock de mongoose
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(true),
}))

// Mock de los modelos
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

import { GET, POST } from '@/app/api/expenses/route'
import { getServerSession } from 'next-auth'
import Expense from '@/models/Expense'
import Pharmacy from '@/models/Pharmacy'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('API: POST /api/expenses - pharmacyId validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject if pharmacyId is provided but user has no assignedPharmacies', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: [], // Empty - no access to any pharmacy
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
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
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain('No tienes acceso a esta farmacia')
  })

  it('should reject if pharmacyId is not in user assignedPharmacies', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-002', 'PHARM-003'], // Only these pharmacies
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
      receiptDate: '2024-01-15T00:00:00.000Z',
      pharmacyId: 'pharmacy-object-id-123',
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.error).toContain('No tienes acceso a esta farmacia')
  })

  it('should reject if pharmacyId refers to non-existent pharmacy', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // Pharmacy.findOne returns null (pharmacy doesn't exist)
    vi.mocked(Pharmacy.findOne).mockResolvedValue(null)

    const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
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
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Farmacia no encontrada')
  })

  it('should reject if pharmacyId refers to inactive pharmacy', async () => {
    // Arrange
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // Pharmacy exists but isActive: false
    // Mock needs to handle two calls: first with isActive: true (returns null), then without filter (returns inactive)
    const inactivePharmacy = {
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Test',
      isActive: false,
    }
    vi.mocked(Pharmacy.findOne).mockImplementation((query: any) => {
      // First call has isActive: true filter - return null (not active)
      if (query.isActive === true) {
        return Promise.resolve(null)
      }
      // Second call has no filter - return inactive pharmacy
      return Promise.resolve(inactivePharmacy)
    })

    const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
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
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('inactiva')
  })

  it('should create expense with pharmacyId when pharmacyId is valid and active', async () => {
    // Arrange
    const mockPharmacyId = 'pharmacy-object-id-123'
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        assignedPharmacies: ['PHARM-001'],
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // Pharmacy exists and is active
    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: mockPharmacyId,
      pharmacyName: 'Farmacia Central',
      isActive: true,
    })

    // Expense.create returns the created expense
    const mockExpense = {
      _id: 'expense-id-123',
      expenseNumber: 'EXP-2024-0001',
      pharmacy: mockPharmacyId,
      pharmacyName: 'Farmacia Central',
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
      status: 'PENDING',
    }
    vi.mocked(Expense.create).mockResolvedValue(mockExpense as any)

    const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
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
    const json = await response.json()
    expect(json.pharmacy).toBe(mockPharmacyId) // Should be pharmacy ObjectId, NOT user id
    expect(json.pharmacyName).toBe('Farmacia Central')
    expect(Expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacy: mockPharmacyId, // Must use pharmacy ObjectId, NOT session.user.id
      })
    )
  })

  it('should fallback to default behavior (no pharmacyId) - backwards compatible', async () => {
    // Arrange: No pharmacyId provided - should work as before (using first assigned pharmacy or user name)
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Farmacia Sur',
        assignedPharmacies: ['PHARM-001'],
      },
    }
    mockGetServerSession.mockResolvedValue(mockSession)

    // If pharmacyId is provided, look it up
    vi.mocked(Pharmacy.findOne).mockResolvedValue({
      _id: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Sur',
      isActive: true,
    })

    const mockExpense = {
      _id: 'expense-id-123',
      expenseNumber: 'EXP-2024-0001',
      pharmacy: 'pharmacy-id-123',
      pharmacyName: 'Farmacia Sur',
      amount: 1500,
      status: 'PENDING',
    }
    vi.mocked(Expense.create).mockResolvedValue(mockExpense as any)

    const body = {
      amount: 1500,
      currency: 'ARS',
      category: 'SERVICIOS',
      description: 'Pago de luz',
      receiptDate: '2024-01-15T00:00:00.000Z',
      // No pharmacyId - backwards compatible
    }

    const req = new NextRequest('http://localhost:3000/api/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    // Act
    const response = await POST(req)

    // Assert - should use first assignedPharmacy
    expect(response.status).toBe(201)
    expect(Pharmacy.findOne).toHaveBeenCalledWith({
      _id: 'PHARM-001',
      isActive: true,
    })
  })
})