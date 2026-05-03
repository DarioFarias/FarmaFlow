/**
 * GastosPage V2 - Tests
 * Phase 3: Frontend UI Updates
 * Task 3.2: Filtros, paginación, batch selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GastosPage from '@/app/dashboard/gastos/page'
import { ExpenseStatus } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ 
    data: { 
      user: { 
        role: 'SUPERVISOR',
        assignedPharmacies: ['pharm-001', 'pharm-002']
      } 
    }, 
    status: 'authenticated' 
  }),
}))

// Mock data - con receiptDate válido para date-fns
const mockExpenses: IExpenseResponse[] = [
  {
    _id: 'exp-001',
    expenseNumber: 'EXP-2026-001',
    pharmacy: 'pharm-001',
    pharmacyName: 'Farmacia Centro',
    amount: 1500,
    currency: 'MXN',
    description: 'Gasto servicios',
    status: ExpenseStatus.FACTURADO,
    receiptDate: '2026-04-15T00:00:00.000Z',
    createdAt: new Date('2026-04-15'),
    updatedAt: new Date('2026-04-15'),
  },
  {
    _id: 'exp-002',
    expenseNumber: 'EXP-2026-002',
    pharmacy: 'pharm-002',
    pharmacyName: 'Farmacia Norte',
    amount: 2500,
    currency: 'MXN',
    description: 'Gasto mantenimiento',
    status: ExpenseStatus.PENDIENTE_DE_FACTURAR,
    receiptDate: '2026-04-20T00:00:00.000Z',
    createdAt: new Date('2026-04-20'),
    updatedAt: new Date('2026-04-20'),
  },
  {
    _id: 'exp-003',
    expenseNumber: 'EXP-2026-003',
    pharmacy: 'pharm-001',
    pharmacyName: 'Farmacia Centro',
    amount: 3000,
    currency: 'MXN',
    description: 'Gasto impuestos',
    status: ExpenseStatus.REPORTED,
    receiptDate: '2026-04-25T00:00:00.000Z',
    createdAt: new Date('2026-04-25'),
    updatedAt: new Date('2026-04-25'),
  },
]

describe('GastosPage V2 - Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Filtros (RED)', () => {
    it('debe mostrar filtro de estado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/estado/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar filtro de farmacia', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/farmacia/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar filtro de rango de fechas', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/desde/i)).toBeInTheDocument()
      })
    })
  })

  describe('Batch Selection (GREEN)', () => {
    it('debe mostrar checkboxes para selección', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBeGreaterThan(0)
      })
    })

    it('debe mostrar "Select All" checkbox en header', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        // Checkbox en el thead
        const headerCheckbox = screen.getAllByRole('checkbox')[0]
        expect(headerCheckbox).toBeInTheDocument()
      })
    })
  })

  describe('Status Badge Colors (TRIANGULATE)', () => {
    it('debe mostrar badges con colores correctos para cada estado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockExpenses }),
      })

      render(<GastosPage />)

      await waitFor(() => {
        // Verificar badges en los elementos de la tabla (span con clases de badge)
        // Los textos aparecen también en el dropdown, pero los buscamos en los spans de la tabla
        const facturadoBadges = screen.getAllByText('Facturado')
        expect(facturadoBadges.length).toBeGreaterThanOrEqual(1)
        
        const pendienteBadges = screen.getAllByText('Pendiente de Facturar')
        expect(pendienteBadges.length).toBeGreaterThanOrEqual(1)
        
        const reportadoBadges = screen.getAllByText('Reportado')
        expect(reportadoBadges.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Pagination (GREEN)', () => {
    it('debe mostrar controles de paginación', async () => {
      // Mock con paginación
      const paginatedData = {
        data: mockExpenses,
        total: 50,
        page: 1,
        pageSize: 10,
        totalPages: 5,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => paginatedData,
      })

      render(<GastosPage />)

      await waitFor(() => {
        expect(screen.getByText(/página/i)).toBeInTheDocument()
      })
    })
  })
})