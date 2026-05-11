// Import the mocked hook
import { useExpenses } from '@/lib/hooks/use-expenses'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GastosPage from '../page'

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

// Mock the useExpenses hook
vi.mock('@/lib/hooks/use-expenses', () => ({
  useExpenses: vi.fn(() => ({
    expenses: [
      {
        _id: 'exp-1',
        expenseNumber: 'EXP-2024-0001',
        receiptDate: '2024-01-15T00:00:00Z',
        pharmacyName: 'Farmacia Centro',
        description: 'Pago de luz',
        amount: 1500,
        currency: 'MXN',
        category: 'UTILITIES',
        status: 'PENDING',
      },
      {
        _id: 'exp-2',
        expenseNumber: 'EXP-2024-0002',
        receiptDate: '2024-01-16T00:00:00Z',
        pharmacyName: 'Farmacia Sur',
        description: 'Reparación de aire',
        amount: 2500,
        currency: 'MXN',
        category: 'MAINTENANCE',
        status: 'APPROVED',
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }))
}))

// Mock AuditActions component
vi.mock('@/components/audit/AuditActions', () => ({
  AuditActions: ({ id }: { id: string }) => (
    <div data-testid="audit-actions">Audit for {id}</div>
  )
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('GastosPage', () => {
  it('should render loading state initially', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({
      expenses: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    // Check for loading spinner (SVG with animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should render expense list with correct data', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    // Check expense numbers are displayed
    expect(screen.getByText('EXP-2024-0001')).toBeInTheDocument()
    expect(screen.getByText('EXP-2024-0002')).toBeInTheDocument()

    // Check descriptions
    expect(screen.getByText('Pago de luz')).toBeInTheDocument()
    expect(screen.getByText('Reparación de aire')).toBeInTheDocument()

    // Check amounts (formatted)
    expect(screen.getByText('MXN 1,500')).toBeInTheDocument()
    expect(screen.getByText('MXN 2,500')).toBeInTheDocument()
  })

  it('should render status badges for expenses', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Aprobado')).toBeInTheDocument()
  })

  it('should render pharmacy column for admin users', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    // Pharmacy names should be visible
    expect(screen.getByText('Farmacia Centro')).toBeInTheDocument()
    expect(screen.getByText('Farmacia Sur')).toBeInTheDocument()
  })

  it('should render audit actions for admin users', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    expect(screen.getAllByTestId('audit-actions')).toHaveLength(2)
  })

  it('should render empty state when no expenses', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({
      expenses: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    expect(screen.getByText(/No hay gastos registrados/i)).toBeInTheDocument()
  })

  it('should render error state with retry button', () => {
    vi.mocked(useExpenses).mockReturnValueOnce({
      expenses: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    })

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <GastosPage />
      </QueryClientProvider>
    )

    expect(screen.getByText(/Error al cargar los gastos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
  })
})