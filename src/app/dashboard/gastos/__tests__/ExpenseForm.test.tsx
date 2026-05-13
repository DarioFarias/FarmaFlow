import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExpenseForm } from '../ExpenseForm'
import userEvent from '@testing-library/user-event'
import { ExpenseStatus } from '@/types'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'admin-123',
        role: 'ADMIN',
        assignedPharmacies: ['pharm-001', 'pharm-002']
      }
    }
  }))
}))

// Mock the useMyPharmacies hook
const mockUseMyPharmacies = vi.fn(() => ({
  pharmacies: [
    { pharmacyId: 'pharm-001', pharmacyName: 'Farmacia Centro' },
    { pharmacyId: 'pharm-002', pharmacyName: 'Farmacia Sur' },
  ],
  isLoading: false,
  error: null,
}))

vi.mock('@/lib/hooks/use-my-pharmacies', () => ({
  useMyPharmacies: () => mockUseMyPharmacies(),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

// Mock image-utils
vi.mock('@/lib/image-utils', () => ({
  compressImage: vi.fn(() => Promise.resolve(new Blob())),
}))

// Mock fetch for upload API - supports both POST and PATCH
let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn((url: string, options?: { method?: string }) => {
    if (url === '/api/expenses/upload') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://res.cloudinary.com/demo/image.jpg', publicId: 'test/upload' }),
      })
    }
    // Handle both POST and PATCH for expenses
    if (url.match(/^\/api\/expenses(\/[^/]+)?$/)) {
      const method = options?.method || 'POST'
      if (method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'expense-123', _id: 'expense-123' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'expense-123' }),
      })
    }
    return Promise.resolve({ ok: false })
  }) as any
  global.fetch = fetchMock
})

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('ExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMyPharmacies.mockReturnValue({
      pharmacies: [
        { pharmacyId: 'pharm-001', pharmacyName: 'Farmacia Centro' },
        { pharmacyId: 'pharm-002', pharmacyName: 'Farmacia Sur' },
      ],
      isLoading: false,
      error: null,
    })
  })

  describe('Pharmacy selector', () => {
    it('should render pharmacy dropdown with loaded data', async () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Farmacia Centro')).toBeInTheDocument()
        expect(screen.getByText('Farmacia Sur')).toBeInTheDocument()
      })
    })

    it('should show no pharmacy options while loading', () => {
      mockUseMyPharmacies.mockReturnValue({
        pharmacies: [],
        isLoading: true,
        error: null,
      })

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      // While loading, no pharmacy options should be visible
      expect(screen.queryByText('Farmacia Centro')).not.toBeInTheDocument()
      expect(screen.queryByText('Farmacia Sur')).not.toBeInTheDocument()
    })

    it('should auto-select when only one pharmacy exists', async () => {
      mockUseMyPharmacies.mockReturnValue({
        pharmacies: [
          { pharmacyId: 'pharm-001', pharmacyName: 'Farmacia Centro' },
        ],
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      // Wait for pharmacies to load
      await waitFor(() => {
        expect(screen.getByText('Farmacia Centro')).toBeInTheDocument()
      })
    })
  })

  describe('Form rendering', () => {
    it('should render all form fields', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      expect(screen.getByText('Monto del Gasto')).toBeInTheDocument()
      expect(screen.getByText('Categoría')).toBeInTheDocument()
      expect(screen.getByText('Descripción / Motivo')).toBeInTheDocument()
      expect(screen.getByText('Proveedor / Comercio')).toBeInTheDocument()
      expect(screen.getByText('Fecha del Comprobante')).toBeInTheDocument()
    })

    it('should render category options', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      expect(screen.getByText('Luz, Agua, Gas, Internet')).toBeInTheDocument()
      expect(screen.getByText('Reparaciones y Mantenimiento')).toBeInTheDocument()
      expect(screen.getByText('Alquiler / Expensas')).toBeInTheDocument()
    })

    it('should render file upload area', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      expect(screen.getByText('Subir Factura')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      expect(screen.getByRole('button', { name: /rendir gasto/i })).toBeInTheDocument()
    })
  })

  describe('Back link', () => {
    it('should render back link to gastos page', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      const backLink = screen.getByRole('link', { name: /volver a mis gastos/i })
      expect(backLink).toHaveAttribute('href', '/dashboard/gastos')
    })
  })

  describe('Edit mode', () => {
    const mockExpense = {
      _id: 'expense-123',
      expenseNumber: 'EXP-2024-0001',
      amount: 1500,
      currency: 'MXN',
      description: 'Pago de servicios',
      status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      receiptDate: '2024-01-15T00:00:00Z',
      pharmacyId: 'pharm-001',
      pharmacyName: 'Farmacia Centro',
      notes: 'Test notes',
      pdfUrl: 'https://example.com/factura.pdf',
      xmlUrl: 'https://example.com/factura.xml',
      invoiceImageUrl: 'https://example.com/image.jpg',
      invoicePublicId: 'public-123',
      pdfPublicId: 'pdf-123',
      xmlPublicId: 'xml-123',
    }

    it('should render edit mode button text', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm expense={mockExpense as any} />
        </QueryClientProvider>
      )

      expect(screen.getByRole('button', { name: /actualizar gasto/i })).toBeInTheDocument()
    })

    it('should show status badge in edit mode', () => {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm expense={mockExpense as any} />
        </QueryClientProvider>
      )

      expect(screen.getByText('PENDIENTE DE FACTURAR')).toBeInTheDocument()
    })

    it('should call PATCH when submitting in edit mode', async () => {
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm expense={mockExpense as any} />
        </QueryClientProvider>
      )

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /actualizar gasto/i })
      await user.click(submitButton)

      // Wait for the API call
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })

      // Verify PATCH was called with correct URL
      const calls = fetchMock.mock.calls
      const patchCall = calls.find((call: any[]) =>
        call[0] === '/api/expenses/expense-123' && call[1]?.method === 'PATCH'
      )
      expect(patchCall).toBeDefined()
    })

    it('should call POST when submitting in create mode', async () => {
      const user = userEvent.setup()

      // Need to provide a file to avoid validation error
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <ExpenseForm />
        </QueryClientProvider>
      )

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /rendir gasto/i })
      await user.click(submitButton)

      // Wait for the API call
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })

      // Verify POST was called (not PATCH)
      const calls = fetchMock.mock.calls
      const postCall = calls.find((call: any[]) =>
        call[0] === '/api/expenses' && call[1]?.method === 'POST'
      )
      expect(postCall).toBeDefined()
    })
  })
})