import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PharmacyCard } from './PharmacyCard'
import { IPharmacyMetrics } from '@/types/api-responses'
import { SessionProvider } from 'next-auth/react'

// =============================================
// Tests para PharmacyCard Component
// =============================================

// Mock de next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  SessionProvider: ({ children }: any) => children,
}))

// Helper para renderizar con sesión
const renderWithSession = (component: React.ReactElement, session: any) => {
  return render(
    <SessionProvider session={session}>
      {component}
    </SessionProvider>
  )
}

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

  // ========== PERMISOS POR ROL ==========

  describe('Permisos por rol', () => {
    // Tests para SUPER_ADMIN
    describe('SUPER_ADMIN role', () => {
      it('shows Ver link for SUPER_ADMIN', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPER_ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Ver')).toBeInTheDocument()
      })

      it('shows Editar link for SUPER_ADMIN', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPER_ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Editar')).toBeInTheDocument()
      })

      it('shows Eliminar button for SUPER_ADMIN', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPER_ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Eliminar')).toBeInTheDocument()
      })
    })

    // Tests para ADMIN
    describe('ADMIN role', () => {
      it('shows Ver link for ADMIN', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Ver')).toBeInTheDocument()
      })

      it('shows Editar link for ADMIN', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Editar')).toBeInTheDocument()
      })

      it('does NOT show Eliminar button for ADMIN (only SUPER_ADMIN)', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ADMIN' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
      })
    })

    // Tests para SUPERVISOR
    describe('SUPERVISOR role', () => {
      it('shows Ver link for SUPERVISOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPERVISOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.getByText('Ver')).toBeInTheDocument()
      })

      it('does NOT show Editar link for SUPERVISOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPERVISOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Editar')).not.toBeInTheDocument()
      })

      it('does NOT show Eliminar button for SUPERVISOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'SUPERVISOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
      })
    })

    // Tests para VENDEDOR
    describe('VENDEDOR role', () => {
      it('does NOT show Ver link for VENDEDOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'VENDEDOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Ver')).not.toBeInTheDocument()
      })

      it('does NOT show Editar link for VENDEDOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'VENDEDOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Editar')).not.toBeInTheDocument()
      })

      it('does NOT show Eliminar button for VENDEDOR', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'VENDEDOR' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
      })
    })

    // Tests para ENCARGADO
    describe('ENCARGADO role', () => {
      it('does NOT show Ver link for ENCARGADO', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ENCARGADO' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Ver')).not.toBeInTheDocument()
      })

      it('does NOT show Editar link for ENCARGADO', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ENCARGADO' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Editar')).not.toBeInTheDocument()
      })

      it('does NOT show Eliminar button for ENCARGADO', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: { user: { role: 'ENCARGADO' } },
          status: 'authenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
      })
    })

    // Tests sin sesión (no autenticado)
    describe('No autenticado', () => {
      it('does NOT show Ver link when no session', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: null,
          status: 'unauthenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Ver')).not.toBeInTheDocument()
      })

      it('does NOT show Editar link when no session', () => {
        vi.mocked(require('next-auth/react').useSession).mockReturnValue({
          data: null,
          status: 'unauthenticated',
        })
        render(<PharmacyCard pharmacy={mockPharmacy} />)
        expect(screen.queryByText('Editar')).not.toBeInTheDocument()
      })
    })
  })
})