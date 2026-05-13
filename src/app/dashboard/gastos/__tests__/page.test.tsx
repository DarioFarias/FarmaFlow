// Rewrite test to mock fetch() + useSession as page.tsx actually uses
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GastosPage from '../page'
import { ExpenseStatus } from '@/types'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'user-123',
        role: 'SUPERVISOR',
        assignedPharmacies: ['pharm-001']
      }
    }
  }))
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock AuditActions component
vi.mock('@/components/audit/AuditActions', () => ({
  AuditActions: ({ id }: { id: string }) => (
    <div data-testid="audit-actions">Audit for {id}</div>
  )
}))

// Mock BatchActionToolbar
vi.mock('@/components/gastos/BatchActionToolbar', () => ({
  BatchActionToolbar: () => null
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
  {
    _id: 'exp-3',
    expenseNumber: 'EXP-2024-0003',
    receiptDate: '2024-01-17T00:00:00Z',
    pharmacyName: 'Farmacia Centro',
    description: 'Gasto reportado',
    amount: 500,
    currency: 'MXN',
    status: ExpenseStatus.REPORTED,
  },
]

describe('GastosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    // Mock fetch to return loading state
    mockFetch.mockImplementation(() => {
      return new Promise(() => {}) // Never resolves to keep loading
    })

    render(<GastosPage />)

    // Check for loading spinner
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  it('should render expense list with correct data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockExpenses,
        total: 3,
        totalPages: 1
      })
    })

    render(<GastosPage />)

    // Wait for data to load - use getAllByText since both table and cards render
    await waitFor(() => {
      expect(screen.getAllByText('EXP-2024-0001').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('EXP-2024-0002').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pago de luz').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reparación de aire').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MXN 1,500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MXN 2,500').length).toBeGreaterThan(0)
  })

  it('should render status badges for expenses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockExpenses,
        total: 3,
        totalPages: 1
      })
    })

    render(<GastosPage />)

    await waitFor(() => {
      // Use getAllByText since both table and cards render status badges
      expect(screen.getAllByText('Pendiente de Facturar').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Facturado').length).toBeGreaterThan(0)
  })

  it('should render pharmacy column for admin users', async () => {
    // Mock admin session
    vi.mock('next-auth/react', () => ({
      useSession: vi.fn(() => ({
        data: {
          user: {
            id: 'user-123',
            role: 'ADMIN',
            assignedPharmacies: ['pharm-001']
          }
        }
      }))
    }))

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockExpenses,
        total: 3,
        totalPages: 1
      })
    })

    // Need to re-render with admin mock
    const { rerender } = render(<GastosPage />)

    await waitFor(() => {
      // There are multiple "Farmacia Centro" (in filter dropdown and table/cards), use getAllBy
      expect(screen.getAllByText('Farmacia Centro').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Farmacia Sur').length).toBeGreaterThan(0)
  })

  it('should render audit actions for admin users', async () => {
    vi.mock('next-auth/react', () => ({
      useSession: vi.fn(() => ({
        data: {
          user: {
            id: 'user-123',
            role: 'ADMIN',
            assignedPharmacies: ['pharm-001']
          }
        }
      }))
    }))

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockExpenses,
        total: 3,
        totalPages: 1
      })
    })

    const { rerender } = render(<GastosPage />)

    await waitFor(() => {
      // Both desktop table and mobile cards render audit actions
      expect(screen.getAllByTestId('audit-actions').length).toBeGreaterThanOrEqual(3)
    })
  })

  it('should render empty state when no expenses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        total: 0,
        totalPages: 0
      })
    })

    render(<GastosPage />)

    await waitFor(() => {
      // Both desktop and mobile empty states render
      expect(screen.getAllByText(/No hay gastos registrados/i).length).toBeGreaterThan(0)
    })
  })

  it('should show edit button for PENDIENTE_DE_FACTURAR status', async () => {
    const pendingExpense = [{
      _id: 'exp-edit-1',
      expenseNumber: 'EXP-2024-0100',
      receiptDate: '2024-01-15T00:00:00Z',
      pharmacyName: 'Farmacia Centro',
      description: 'Gasto pendiente',
      amount: 100,
      currency: 'MXN',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
    }]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: pendingExpense,
        total: 1,
        totalPages: 1
      })
    })

    render(<GastosPage />)

    await waitFor(() => {
      // Both desktop and mobile have edit buttons
      expect(screen.getAllByRole('link', { name: /editar/i }).length).toBeGreaterThan(0)
    })
  })

  it('should NOT show edit button for REPORTED status', async () => {
    const reportedExpense = [{
      _id: 'exp-edit-3',
      expenseNumber: 'EXP-2024-0102',
      receiptDate: '2024-01-17T00:00:00Z',
      pharmacyName: 'Farmacia Centro',
      description: 'Gasto reportado',
      amount: 300,
      currency: 'MXN',
      status: ExpenseStatus.REPORTED,
    }]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: reportedExpense,
        total: 1,
        totalPages: 1
      })
    })

    render(<GastosPage />)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument()
    })
  })

  describe('Responsive behavior', () => {
    it('should render table in desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockExpenses,
          total: 3,
          totalPages: 1
        })
      })

      render(<GastosPage />)

      await waitFor(() => {
        // Table should be visible (hidden md:block means visible at 1024px)
        const table = document.querySelector('table')
        expect(table).toBeInTheDocument()
      })
    })

    it('should render cards in mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockExpenses,
          total: 3,
          totalPages: 1
        })
      })

      render(<GastosPage />)

      await waitFor(() => {
        // Cards section should be visible in mobile (block md:hidden)
        const cardSection = document.querySelector('.block.md\\:hidden.space-y-3')
        expect(cardSection).toBeInTheDocument()
      })
    })

    it('should show filters toggle button on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
          totalPages: 0
        })
      })

      render(<GastosPage />)

      await waitFor(() => {
        // Filters toggle should be visible on mobile (md:hidden)
        const toggleButton = screen.getByText('Filtros')
        expect(toggleButton).toBeInTheDocument()
      })
    })
  })
})