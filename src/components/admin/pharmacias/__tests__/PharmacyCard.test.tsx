/**
 * @fileoverview Unit tests for PharmacyCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PharmacyCard } from '../PharmacyCard'
import type { IPharmacyMetrics } from '@/types/api-responses'

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { role: 'SUPER_ADMIN' } },
    status: 'authenticated',
  }),
}))

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock de fetch
global.fetch = vi.fn()

const mockPharmacy: IPharmacyMetrics = {
  _id: 'pharm-001',
  pharmacyName: 'Farmacia Test',
  address: 'Calle Test 123',
  phone: '+52 55 1234 5678',
  email: 'test@pharmacy.com',
  isActive: true,
  pendingSupplyRequests: 3,
  pendingExpenses: 1,
  assignedUsers: [
    { name: 'Juan Pérez', role: 'ENCARGADO' },
    { name: 'Maria López', role: 'VENDEDOR' },
  ],
  monthlySummary: {
    totalExpensesThisMonth: 5000,
    deliveredOrders: 15,
    activeUsers: 2,
    lastActivity: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('PharmacyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  it('should render pharmacy name', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Farmacia Test')).toBeInTheDocument()
  })

  it('should show active badge when pharmacy is active', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('should show inactive badge when pharmacy is not active', () => {
    const inactivePharmacy = { ...mockPharmacy, isActive: false }
    render(<PharmacyCard pharmacy={inactivePharmacy} />)
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })

  it('should display contact information', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Calle Test 123')).toBeInTheDocument()
    expect(screen.getByText('+52 55 1234 5678')).toBeInTheDocument()
    expect(screen.getByText('test@pharmacy.com')).toBeInTheDocument()
  })

  it('should display metrics badges', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Pedidos:')).toBeInTheDocument()
    expect(screen.getByText('Gastos:')).toBeInTheDocument()
  })

  it('should show expand/collapse button', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Ver más')).toBeInTheDocument()
  })

  it('should expand to show more details when clicked', async () => {
    const user = userEvent.setup()
    render(<PharmacyCard pharmacy={mockPharmacy} />)

    const expandButton = screen.getByText('Ver más')
    await user.click(expandButton)

    expect(screen.getByText('Ocultar')).toBeInTheDocument()
    expect(screen.getByText('Usuarios Asignados')).toBeInTheDocument()
    expect(screen.getByText('Resumen del Mes')).toBeInTheDocument()
  })

  it('should show "Reactivar" button for SUPER_ADMIN when pharmacy is inactive', async () => {
    const inactivePharmacy = { ...mockPharmacy, isActive: false }
    render(<PharmacyCard pharmacy={inactivePharmacy} />)

    const reactivateButton = screen.getByText('Reactivar')
    expect(reactivateButton).toBeInTheDocument()
  })

  it('should NOT show "Reactivar" button when pharmacy is active', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.queryByText('Reactivar')).not.toBeInTheDocument()
  })

  it('should call handleReactivate and API when clicking Reactivar', async () => {
    const user = userEvent.setup()
    const inactivePharmacy = { ...mockPharmacy, isActive: false }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<PharmacyCard pharmacy={inactivePharmacy} />)

    const reactivateButton = screen.getByText('Reactivar')
    await user.click(reactivateButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/pharmacies/pharm-001',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        })
      )
    })
  })

  it('should call onView callback when provided', async () => {
    const user = userEvent.setup()
    const mockOnView = vi.fn()

    render(<PharmacyCard pharmacy={mockPharmacy} onView={mockOnView} />)

    const viewButton = screen.getByText('Ver')
    await user.click(viewButton)

    expect(mockOnView).toHaveBeenCalledWith(mockPharmacy)
  })

  it('should call onEdit callback when provided', async () => {
    const user = userEvent.setup()
    const mockOnEdit = vi.fn()

    render(<PharmacyCard pharmacy={mockPharmacy} onEdit={mockOnEdit} />)

    const editButton = screen.getByText('Editar')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockPharmacy)
  })

  it('should show delete confirmation modal when clicking delete', async () => {
    const user = userEvent.setup()
    render(<PharmacyCard pharmacy={mockPharmacy} />)

    // Click delete button in the card footer
    const deleteButton = screen.getByRole('button', { name: /eliminar/i })
    await user.click(deleteButton)

    // Verify modal appears
    expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument()
    // Check for the strong element inside the modal
    expect(screen.getByText('Farmacia Test', { selector: 'strong' })).toBeInTheDocument()
  })

  it('should close delete modal when clicking cancel', async () => {
    const user = userEvent.setup()
    render(<PharmacyCard pharmacy={mockPharmacy} />)

    // Open modal
    const deleteButton = screen.getByText('Eliminar')
    await user.click(deleteButton)

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument()
  })

  it('should call delete API when confirming delete', async () => {
    const user = userEvent.setup()
    const mockOnDeleteSuccess = vi.fn()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<PharmacyCard pharmacy={mockPharmacy} onDeleteSuccess={mockOnDeleteSuccess} />)

    // Open modal - click the delete button in the card footer (not in modal)
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
    await user.click(deleteButtons[0]) // First button is in the card

    // Confirm delete - click the second button (the one inside the modal)
    const confirmButtons = screen.getAllByRole('button', { name: /eliminar/i })
    await user.click(confirmButtons[1]) // Second button is in the modal

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/pharmacies/pharm-001',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })
})