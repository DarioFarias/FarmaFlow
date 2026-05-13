// Test the Client Component with mock props and AJAX behavior
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { GastosListClient } from '../GastosListClient'
import { UserRole, ExpenseStatus } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'

// Mock AuditActions
vi.mock('@/components/audit/AuditActions', () => ({
  AuditActions: ({ id }: { id: string }) => (
    <div data-testid="audit-actions">Audit for {id}</div>
  ),
}))

// Mock BatchActionToolbar
vi.mock('@/components/gastos/BatchActionToolbar', () => ({
  BatchActionToolbar: ({ selectedIds, onClear }: any) => (
    <div data-testid="batch-toolbar">
      <span data-testid="selected-count">{selectedIds.length}</span>
      <button onClick={onClear} data-testid="clear-selection">Clear</button>
    </div>
  ),
}))

// Mock fetch globally
let mockFetch: ReturnType<typeof vi.fn>
beforeEach(() => {
  mockFetch = vi.fn()
  global.fetch = mockFetch as typeof fetch
})

afterEach(() => {
  vi.clearAllMocks()
})

// Sample expense data - typed as IExpenseResponse (with all required fields)
const mockExpenses: IExpenseResponse[] = [
  {
    _id: 'exp-1',
    expenseNumber: 'EXP-2024-0001',
    pharmacy: 'pharm-001',
    pharmacyName: 'Farmacia Centro',
    amount: 1500,
    currency: 'MXN',
    category: 'SERVICIOS',
    description: 'Pago de luz',
    receiptDate: '2024-01-15T00:00:00Z',
    status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    _id: 'exp-2',
    expenseNumber: 'EXP-2024-0002',
    pharmacy: 'pharm-002',
    pharmacyName: 'Farmacia Sur',
    amount: 2500,
    currency: 'MXN',
    category: 'MANTENIMIENTO',
    description: 'Reparación de aire',
    receiptDate: '2024-01-16T00:00:00Z',
    status: ExpenseStatus.FACTURADO,
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
]

const mockPharmacies = [
  { pharmacyId: 'pharm-001', pharmacyName: 'Farmacia Centro' },
  { pharmacyId: 'pharm-002', pharmacyName: 'Farmacia Sur' },
]

describe('GastosListClient', () => {
  it('should render initial data without loading', () => {
    render(
      <GastosListClient
        initialGastos={mockExpenses}
        initialPagination={{ page: 1, pageSize: 20, total: 2, totalPages: 1 }}
        userRole={UserRole.SUPERVISOR}
        pharmacies={mockPharmacies}
      />
    )

    // Should show data immediately without loading spinner
    // Both desktop table AND mobile cards render the same data, so getAllByText
    expect(screen.getAllByText('EXP-2024-0001').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('EXP-2024-0002').length).toBeGreaterThanOrEqual(1)
  })

  it('should render empty state when no expenses', () => {
    render(
      <GastosListClient
        initialGastos={[]}
        initialPagination={{ page: 1, pageSize: 20, total: 0, totalPages: 0 }}
        userRole={UserRole.SUPERVISOR}
        pharmacies={[]}
      />
    )

    // Empty state renders in both desktop and mobile views
    const emptyMessages = screen.getAllByText(/No hay gastos registrados/i)
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1)
  })

  it('should trigger AJAX fetch when applying filters', async () => {
    // Mock for both pharmacy fetch (on mount) and expense fetch (on apply)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        total: 0,
        totalPages: 0,
      }),
    })

    render(
      <GastosListClient
        initialGastos={[]}
        initialPagination={{ page: 1, pageSize: 20, total: 0, totalPages: 0 }}
        userRole={UserRole.SUPERVISOR}
        pharmacies={[]}
      />
    )

    // Wait for pharmacy fetch on mount, then clear mock calls
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    mockFetch.mockClear()

    // Change filter value (simulate selecting a status)
    const statusSelect = screen.getByLabelText('Estado') as HTMLSelectElement
    fireEvent.change(statusSelect, { target: { value: 'PENDIENTE_DE_FACTURAR' } })

    // Click apply button
    const applyButton = screen.getByText('Aplicar')
    await act(async () => {
      applyButton.click()
    })

    // Verify fetch was called with filter params
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=PENDIENTE_DE_FACTURAR')
      )
    })
  })

  it('should trigger AJAX fetch when changing pagination', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockExpenses,
        total: 40,
        totalPages: 2,
      }),
    })

    render(
      <GastosListClient
        initialGastos={mockExpenses}
        initialPagination={{ page: 1, pageSize: 20, total: 40, totalPages: 2 }}
        userRole={UserRole.VENDEDOR} // Non-admin to avoid pharmacy fetch
        pharmacies={[]}
      />
    )

    // Wait for any initial fetches to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Click next page button (desktop pagination)
    const nextButtons = screen.getAllByRole('button', { name: 'Página siguiente' })
    await act(async () => {
      fireEvent.click(nextButtons[0])
    })

    // Verify fetch was called with page=2
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      )
    })
  })

  it('should toggle batch select all', async () => {
    render(
      <GastosListClient
        initialGastos={mockExpenses}
        initialPagination={{ page: 1, pageSize: 20, total: 2, totalPages: 1 }}
        userRole={UserRole.SUPERVISOR}
        pharmacies={[]}
      />
    )

    // Click select all checkbox
    const selectAllCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    await act(async () => {
      selectAllCheckbox?.click()
    })

    // Verify selection
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('2')
    })
  })

  it('should show admin columns for admin role', () => {
    render(
      <GastosListClient
        initialGastos={mockExpenses}
        initialPagination={{ page: 1, pageSize: 20, total: 2, totalPages: 1 }}
        userRole={UserRole.ADMIN}
        pharmacies={mockPharmacies}
      />
    )

    // 'Sucursal' appears in both desktop table header and mobile card detail
    const sucursalTexts = screen.getAllByText('Sucursal')
    expect(sucursalTexts.length).toBeGreaterThanOrEqual(1)
    // Verify audit actions exist
    expect(screen.getAllByTestId('audit-actions').length).toBeGreaterThan(0)
  })

  it('should NOT show admin columns for non-admin role', () => {
    render(
      <GastosListClient
        initialGastos={mockExpenses}
        initialPagination={{ page: 1, pageSize: 20, total: 2, totalPages: 1 }}
        userRole={UserRole.VENDEDOR}
        pharmacies={[]}
      />
    )

    // Pharmacy column should not exist
    expect(screen.queryByText('Sucursal')).not.toBeInTheDocument()
  })

  it('should show loading state during AJAX', async () => {
    // Mock fetch that takes time
    mockFetch.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    )

    render(
      <GastosListClient
        initialGastos={[]}
        initialPagination={{ page: 1, pageSize: 20, total: 0, totalPages: 0 }}
        userRole={UserRole.SUPERVISOR}
        pharmacies={[]}
      />
    )

    // Click apply to trigger loading
    const applyButton = screen.getByText('Aplicar')
    applyButton.click()

    // Should show loading spinner
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })
})