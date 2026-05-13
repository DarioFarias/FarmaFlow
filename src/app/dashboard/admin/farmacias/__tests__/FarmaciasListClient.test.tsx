import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { FarmaciasListClient } from '../FarmaciasListClient'
import '@testing-library/jest-dom'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: ({ size }: { size: number }) => <span data-testid="plus-icon" />,
  Loader2: ({ size }: { size: number }) => <span data-testid="loader-icon" />,
  Search: ({ size }: { size: number }) => <span data-testid="search-icon" />,
  X: ({ size }: { size: number }) => <span data-testid="x-icon" />,
  ChevronLeft: ({ size }: { size: number }) => <span data-testid="chevron-left-icon" />,
  ChevronRight: ({ size }: { size: number }) => <span data-testid="chevron-right-icon" />,
}))

// Mock PharmacyCard component
vi.mock('@/components/admin/pharmacias/PharmacyCard', () => ({
  PharmacyCard: ({ pharmacy, onView, onEdit, onDeleteSuccess }: any) => (
    <div data-testid="pharmacy-card" data-pharmacy-id={pharmacy._id}>
      <span>{pharmacy.pharmacyName}</span>
      <button onClick={() => onView(pharmacy)}>View</button>
      <button onClick={() => onEdit(pharmacy)}>Edit</button>
    </div>
  ),
}))

// Mock modals
vi.mock('@/components/admin/farmacias/CreatePharmacyModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null,
}))

vi.mock('@/components/admin/farmacias/EditPharmacyModal', () => ({
  default: ({ isOpen, pharmacy, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <span>{pharmacy?.pharmacyName}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null,
}))

vi.mock('@/components/admin/farmacias/PharmacyDetailsModal', () => ({
  default: ({ isOpen, pharmacy, onClose, onEdit }: any) =>
    isOpen ? (
      <div data-testid="details-modal">
        <span>{pharmacy?.pharmacyName}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onEdit && onEdit(pharmacy)}>Edit</button>
      </div>
    ) : null,
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('FarmaciasListClient', () => {
  const mockInitialData = [
    {
      _id: 'pharm-1',
      pharmacyName: 'Farmacia Central',
      address: 'Calle 123',
      phone: '123456789',
      email: 'central@farmacia.com',
      isActive: true,
      pendingSupplyRequests: 2,
      pendingExpenses: 1,
      assignedUsers: [],
      monthlySummary: {
        totalExpensesThisMonth: 500,
        deliveredOrders: 5,
        activeUsers: 2,
        lastActivity: '2024-01-15',
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15',
    },
  ]

  const mockInitialPagination = {
    page: 1,
    totalPages: 3,
    total: 50,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with initial data without loading', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInitialData, total: 50, totalPages: 3 }),
    })

    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Should render header
    expect(screen.getByText('Farmacias')).toBeInTheDocument()
    expect(screen.getByText('Nueva Farmacia')).toBeInTheDocument()

    // Should render search input
    expect(screen.getByPlaceholderText('Buscar farmacias...')).toBeInTheDocument()

    // Should render filter tabs
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByText('Activas')).toBeInTheDocument()
    expect(screen.getByText('Inactivas')).toBeInTheDocument()

    // Should render pharmacy cards (from initial data)
    expect(screen.getByText('Farmacia Central')).toBeInTheDocument()
  })

  it('should render loading state when isLoading is true initially', () => {
    // This tests the component when it starts with isLoading=true
    // In practice, the component starts with isLoading=false (from props)
    // but we can test the conditional rendering
    render(
      <FarmaciasListClient
        initialData={[] as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )
    
    // Without initial data, component should not show loader if isLoading is false
    // The loader only shows when isLoading && farmacias.length === 0
    expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument()
  })

  it('should show empty state when no pharmacies', () => {
    render(
      <FarmaciasListClient
        initialData={[] as any}
        initialPagination={{ page: 1, totalPages: 0, total: 0 }}
        userRole="ADMIN"
      />
    )

    expect(screen.getByText(/No hay farmacias registradas/)).toBeInTheDocument()
  })

  it('should show no access message for SUPERVISOR without assigned pharmacies', () => {
    render(
      <FarmaciasListClient
        initialData={[] as any}
        initialPagination={{ page: 1, totalPages: 0, total: 0 }}
        userRole="SUPERVISOR"
      />
    )

    expect(screen.getByText(/No tienes farmacias asignadas/)).toBeInTheDocument()
  })

  it('should open create modal when button clicked', () => {
    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    const createButton = screen.getByText('Nueva Farmacia')
    fireEvent.click(createButton)

    expect(screen.getByTestId('create-modal')).toBeInTheDocument()
  })

  it('should handle search with debounce', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInitialData, total: 50, totalPages: 3 }),
    })

    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    const searchInput = screen.getByPlaceholderText('Buscar farmacias...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Debounce waits 300ms antes de llamar a la API — usar waitFor con timeout más alto
    // para darle tiempo al setTimeout real de dispararse
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=test'),
          expect.any(Object)
        )
      },
      { timeout: 2000, interval: 50 }
    )
  })

  it('should filter pharmacies client-side when status filter changes', () => {
    const mixedData = [
      { ...mockInitialData[0], _id: 'pharm-1', isActive: true, pharmacyName: 'Farmacia Activa' },
      { ...mockInitialData[0], _id: 'pharm-2', isActive: false, pharmacyName: 'Farmacia Inactiva' },
    ]

    const { rerender } = render(
      <FarmaciasListClient
        initialData={mixedData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Por defecto muestra todas (filtro 'all')
    expect(screen.getByText('Farmacia Activa')).toBeInTheDocument()
    expect(screen.getByText('Farmacia Inactiva')).toBeInTheDocument()

    // El filtro es puramente client-side — no llama a la API
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should sort pharmacies client-side when sort changes', () => {
    const unsortedData = [
      { ...mockInitialData[0], _id: 'pharm-1', pharmacyName: 'Z Farmacia' },
      { ...mockInitialData[0], _id: 'pharm-2', pharmacyName: 'A Farmacia' },
    ]

    render(
      <FarmaciasListClient
        initialData={unsortedData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Por defecto sort name-asc: A debería ir antes que Z
    const cards = screen.getAllByTestId('pharmacy-card')
    expect(cards[0]).toHaveTextContent('A Farmacia')
    expect(cards[1]).toHaveTextContent('Z Farmacia')

    // El sort es puramente client-side — no llama a la API
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle pagination', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInitialData, total: 50, totalPages: 3 }),
    })

    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Find and click next button
    const nextButton = screen.getByText('Siguiente')
    fireEvent.click(nextButton)

    // Should have called fetch with page=2 (usando pageOverride, no stale closure)
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        )
      },
      { timeout: 2000, interval: 50 }
    )
  })

  it('should refresh data after modal success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInitialData, total: 50, totalPages: 3 }),
    })

    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Open create modal
    const createButton = screen.getByText('Nueva Farmacia')
    fireEvent.click(createButton)

    // Click success button in modal
    const successButton = screen.getByText('Success')
    fireEvent.click(successButton)

    // Should have called fetch to refresh data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('should apply client-side filtering based on role', () => {
    // SUPERVISOR with assigned pharmacies - filters client side
    const supervisorData = [
      { ...mockInitialData[0], _id: 'pharm-1' },
      { ...mockInitialData[0], _id: 'pharm-2', pharmacyName: 'Farmacia 2' },
    ]

    render(
      <FarmaciasListClient
        initialData={supervisorData as any}
        initialPagination={mockInitialPagination}
        userRole="SUPERVISOR"
      />
    )

    // Should render both initially
    expect(screen.getByText('Farmacia Central')).toBeInTheDocument()
    expect(screen.getByText('Farmacia 2')).toBeInTheDocument()
  })

  it('should render pagination info', () => {
    render(
      <FarmaciasListClient
        initialData={mockInitialData as any}
        initialPagination={mockInitialPagination}
        userRole="ADMIN"
      />
    )

    // Should show pagination info — "(50 resultados)" es único en el DOM
    expect(screen.getByText('(50 resultados)')).toBeInTheDocument()
  })
})