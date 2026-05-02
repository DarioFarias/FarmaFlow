/**
 * @fileoverview Integration tests for CreatePharmacyModal
 * RED (test written) → GREEN (implementation) → TRIANGULATE → REFACTOR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatePharmacyModal from '../CreatePharmacyModal'

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

describe('CreatePharmacyModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <CreatePharmacyModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Crear Nueva Farmacia')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <CreatePharmacyModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should have all required form fields', () => {
    render(
      <CreatePharmacyModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should show validation error when submitting empty form', async () => {
    const user = userEvent.setup()

    render(
      <CreatePharmacyModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Click submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /crear/i })
    await user.click(submitButton)

    // Should show validation error (required field)
    expect(screen.getByLabelText(/nombre/i)).toBeInvalid()
  })

  it('should call onClose when clicking cancel button', async () => {
    const user = userEvent.setup()

    render(
      <CreatePharmacyModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'new-pharm-001' } }),
    })

    render(
      <CreatePharmacyModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Fill form
    const nameInput = screen.getByLabelText(/nombre/i)
    await user.type(nameInput, 'Farmacia Test')

    const addressInput = screen.getByLabelText(/dirección/i)
    await user.type(addressInput, 'Calle Test 123')

    // Submit
    const submitButton = screen.getByRole('button', { name: /crear/i })
    await user.click(submitButton)

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/pharmacies',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})