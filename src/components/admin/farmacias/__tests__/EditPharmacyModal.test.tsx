/**
 * @fileoverview Integration tests for EditPharmacyModal
 * RED (test written) → GREEN (implementation) → TRIANGULATE → REFACTOR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPharmacyModal from '../EditPharmacyModal'
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
  pendingSupplyRequests: 5,
  pendingExpenses: 2,
  assignedUsers: [],
  monthlySummary: {
    totalExpensesThisMonth: 1500,
    deliveredOrders: 10,
    activeUsers: 3,
    lastActivity: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('EditPharmacyModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  it('should render modal when isOpen is true with pharmacy data', () => {
    render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Editar Farmacia')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Farmacia Test')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <EditPharmacyModal
        isOpen={false}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should not render when pharmacy is null', () => {
    const { container } = render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should display isActive toggle', () => {
    render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Toggle should show as checked (isActive: true)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeChecked()
  })

  it('should toggle isActive and call API', async () => {
    const user = userEvent.setup()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Click toggle to deactivate
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Verify API was called with isActive: false
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/pharmacies/pharm-001',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isActive: false }),
        })
      )
    })
  })

  it('should call onClose when clicking cancel button', async () => {
    const user = userEvent.setup()

    render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should submit form with updated data', async () => {
    const user = userEvent.setup()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <EditPharmacyModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Update name
    const nameInput = screen.getByDisplayValue('Farmacia Test')
    await user.clear(nameInput)
    await user.type(nameInput, 'Farmacia Actualizada')

    // Submit
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    // Verify API was called with updated data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/pharmacies/pharm-001',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    // Verify the body contains the updated name
    const callArgs = (global.fetch as any).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.pharmacyName).toBe('Farmacia Actualizada')
  })
})