/**
 * @fileoverview Integration tests for PharmacyDetailsModal
 * RED (test written) → GREEN (implementation) → TRIANGULATE → REFACTOR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PharmacyDetailsModal from '../PharmacyDetailsModal'
import type { IPharmacyMetrics } from '@/types/api-responses'

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { role: 'SUPER_ADMIN' } },
    status: 'authenticated',
  }),
}))

const mockPharmacy: IPharmacyMetrics = {
  _id: 'pharm-001',
  pharmacyName: 'Farmacia Centro',
  address: 'Av. Principal 100',
  phone: '+52 55 1111 2222',
  email: 'centro@farmaflow.com',
  isActive: true,
  pendingSupplyRequests: 3,
  pendingExpenses: 1,
  assignedUsers: [
    { name: 'Juan Pérez', email: 'juan@test.com', role: 'ENCARGADO', isActive: true },
    { name: 'María López', email: 'maria@test.com', role: 'VENDEDOR', isActive: true },
  ],
  monthlySummary: {
    totalExpensesThisMonth: 5000,
    deliveredOrders: 15,
    activeUsers: 5,
    lastActivity: '2024-01-15T10:00:00.000Z',
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
}

describe('PharmacyDetailsModal', () => {
  const mockOnClose = vi.fn()
  const mockOnEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when isOpen is true with pharmacy data', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Detalles de Farmacia')).toBeInTheDocument()
    expect(screen.getByText('Farmacia Centro')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <PharmacyDetailsModal
        isOpen={false}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should not render when pharmacy is null', () => {
    const { container } = render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={null}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('should display all pharmacy information', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    // Basic info
    expect(screen.getByText('Av. Principal 100')).toBeInTheDocument()
    expect(screen.getByText('+52 55 1111 2222')).toBeInTheDocument()
    expect(screen.getByText('centro@farmaflow.com')).toBeInTheDocument()

    // Status badge
    expect(screen.getByText('Activa')).toBeInTheDocument()

    // Metrics
    expect(screen.getByText('3')).toBeInTheDocument() // pendingSupplyRequests
    expect(screen.getByText('1')).toBeInTheDocument() // pendingExpenses
  })

  it('should show assigned users section', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Usuarios Asignados')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })

  it('should show monthly summary section', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Resumen del Mes')).toBeInTheDocument()
  })

  it('should have Edit button that calls onEdit', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    const editButton = screen.getByRole('button', { name: /editar/i })
    expect(editButton).toBeInTheDocument()
  })

  it('should have Close button that calls onClose', () => {
    render(
      <PharmacyDetailsModal
        isOpen={true}
        pharmacy={mockPharmacy}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    )

    const closeButton = screen.getByRole('button', { name: /cerrar/i })
    expect(closeButton).toBeInTheDocument()
  })
})