import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PharmacyCard } from './PharmacyCard'
import { IPharmacyMetrics } from '@/types/api-responses'

// =============================================
// Tests para PharmacyCard Component
// =============================================

// Mock de next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

describe('PharmacyCard', () => {
  const mockPharmacy: IPharmacyMetrics = {
    _id: 'pharm-123',
    pharmacyName: 'Farmacia Central',
    address: 'Av. Principal 123',
    phone: '555-1234',
    email: 'central@farma.com',
    isActive: true,
    pendingSupplyRequests: 3,
    pendingExpenses: 2,
    assignedUsers: [
      { name: 'Juan Pérez', role: 'SUPERVISOR', isActive: true, email: 'juan@test.com' },
      { name: 'María García', role: 'ENCARGADO', isActive: true, email: 'maria@test.com' },
    ],
    monthlySummary: {
      totalExpensesThisMonth: 1500,
      deliveredOrders: 5,
      activeUsers: 2,
      lastActivity: '2024-01-15T10:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  }

  // ========== BASIC RENDERING ==========
  
  it('renders pharmacy name', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Farmacia Central')).toBeInTheDocument()
  })

  it('renders address', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Av. Principal 123')).toBeInTheDocument()
  })

  it('renders phone', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('555-1234')).toBeInTheDocument()
  })

  it('displays active badge when pharmacy is active', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} />)
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('displays inactive badge when pharmacy is inactive', () => {
    const inactivePharmacy = { ...mockPharmacy, isActive: false }
    render(<PharmacyCard pharmacy={inactivePharmacy} />)
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })

  // ========== METRICS BADGES ==========
  
  describe('Metrics badges color coding', () => {
    it('shows badges with correct count values', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      expect(screen.getByText('3')).toBeInTheDocument() // pendingSupplyRequests
      expect(screen.getByText('2')).toBeInTheDocument() // pendingExpenses
    })

    it('displays Pedidos label', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      expect(screen.getByText('Pedidos:')).toBeInTheDocument()
    })

    it('displays Gastos label', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      expect(screen.getByText('Gastos:')).toBeInTheDocument()
    })
  })

  // ========== ACCORDION FUNCTIONALITY ==========
  
  describe('Accordion expand/collapse', () => {
    it('shows "Ver más" button initially', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      expect(screen.getByText('Ver más')).toBeInTheDocument()
    })

    it('expands when "Ver más" is clicked', async () => {
      const user = userEvent.setup()
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      
      const expandButton = screen.getByText('Ver más')
      await user.click(expandButton)
      
      expect(screen.getByText('Ocultar')).toBeInTheDocument()
    })

    it('shows assigned users when expanded', async () => {
      const user = userEvent.setup()
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      
      const expandButton = screen.getByText('Ver más')
      await user.click(expandButton)
      
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
    })

    it('shows monthly summary when expanded', async () => {
      const user = userEvent.setup()
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      
      const expandButton = screen.getByText('Ver más')
      await user.click(expandButton)
      
      expect(screen.getByText('Total Gastos:')).toBeInTheDocument()
      expect(screen.getByText('Pedidos Entregados:')).toBeInTheDocument()
    })
  })

  // ========== EDIT LINK ==========
  
  describe('Edit link', () => {
    it('renders Editar link', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })

    it('navigates to correct URL', () => {
      render(<PharmacyCard pharmacy={mockPharmacy} />)
      const editLink = screen.getByText('Editar').closest('a')
      expect(editLink).toHaveAttribute('href', '/dashboard/admin/farmacias/pharm-123/editar')
    })
  })
})