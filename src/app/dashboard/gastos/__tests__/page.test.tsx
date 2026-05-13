// Test the Server Component by mocking session and service layer
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserRole, ExpenseStatus } from '@/types'

// Mock getServerSession
const mockGetServerSession = vi.fn()
vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock getFilteredExpenses service
const mockGetFilteredExpenses = vi.fn()
vi.mock('@/lib/services/expenses', () => ({
  getFilteredExpenses: mockGetFilteredExpenses,
}))

// Mock Pharmacy model
vi.mock('@/models/Pharmacy', () => ({
  default: {
    find: vi.fn(() => ({
      select: vi.fn(() => ({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            then: vi.fn((cb) => cb({
              map: () => [
                { _id: { toString: () => 'pharm-001' }, pharmacyName: 'Farmacia Centro' },
                { _id: { toString: () => 'pharm-002' }, pharmacyName: 'Farmacia Sur' },
              ]
            }))
          }))
        }))
      }))
    })),
  },
}))

// Mock GastosListClient component
vi.mock('../GastosListClient', () => ({
  GastosListClient: ({ initialGastos, initialPagination, userRole, pharmacies }: any) => (
    <div data-testid="gastos-client">
      <div data-testid="gastos-count">{initialGastos?.length || 0}</div>
      <div data-testid="page">{initialPagination?.page}</div>
      <div data-testid="total">{initialPagination?.total}</div>
      <div data-testid="role">{userRole}</div>
      <div data-testid="pharmacies-count">{pharmacies?.length || 0}</div>
    </div>
  ),
}))

// Sample expense data
const mockExpenses = [
  {
    _id: 'exp-1',
    expenseNumber: 'EXP-2024-0001',
    receiptDate: '2024-01-15T00:00:00Z',
    pharmacyName: 'Farmacia Centro',
    description: 'Pago de luz',
    amount: 1500,
    currency: 'MXN',
    status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
  },
  {
    _id: 'exp-2',
    expenseNumber: 'EXP-2024-0002',
    receiptDate: '2024-01-16T00:00:00Z',
    pharmacyName: 'Farmacia Sur',
    description: 'Reparación de aire',
    amount: 2500,
    currency: 'MXN',
    status: ExpenseStatus.FACTURADO,
  },
]

describe('GastosPage (Server Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass correct props to GastosListClient', async () => {
    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.SUPERVISOR,
        assignedPharmacies: ['pharm-001'],
      },
    })

    // Mock service response
    mockGetFilteredExpenses.mockResolvedValue({
      data: mockExpenses,
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      limit: 20,
    })

    // Dynamic import to get the Server Component
    const { default: GastosPage } = await import('../page')

    // Render with empty searchParams
    render(await GastosPage({ searchParams: Promise.resolve({}) }))

    // Verify GastosListClient receives correct props
    expect(screen.getByTestId('gastos-count')).toHaveTextContent('2')
    expect(screen.getByTestId('page')).toHaveTextContent('1')
    expect(screen.getByTestId('total')).toHaveTextContent('2')
    expect(screen.getByTestId('role')).toHaveTextContent('SUPERVISOR')
  })

  it('should pass admin role and pharmacies for admin users', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'admin-123',
        role: UserRole.ADMIN,
        assignedPharmacies: [],
      },
    })

    mockGetFilteredExpenses.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      limit: 20,
    })

    const { default: GastosPage } = await import('../page')

    render(await GastosPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByTestId('role')).toHaveTextContent('ADMIN')
    expect(screen.getByTestId('pharmacies-count')).toHaveTextContent('2') // Mock returns 2 pharmacies
  })

  it('should pass empty initial data when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const { default: GastosPage } = await import('../page')

    // Render - should show unauthorized message
    const { container } = render(await GastosPage({ searchParams: Promise.resolve({}) }))
    
    expect(container.textContent).toContain('No autorizado')
  })
})