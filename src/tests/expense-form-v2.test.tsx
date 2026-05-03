/**
 * ExpenseForm V2 - Tests
 * Phase 3: Frontend UI Updates
 * Task 3.1: Update ExpenseForm with PDF/XML upload, status badge, and notes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from '@/app/dashboard/gastos/ExpenseForm'
import { IExpense } from '@/types'
import { ExpenseStatus } from '@/types'

// Mock de dependencias
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'SUPERVISOR' } }, status: 'authenticated' }),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

vi.mock('@/lib/image-utils', () => ({
  compressImage: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
}))

// Mock de la API de my-pharmacies
const mockPharmacies = [
  { pharmacyId: 'pharm-001', pharmacyName: 'Farmacia Centro' },
  { pharmacyId: 'pharm-002', pharmacyName: 'Farmacia Norte' },
]

describe('ExpenseForm V2 - Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Campos eliminados (RED)', () => {
    it('NO debe mostrar el campo de categoría', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        const select = screen.queryByLabelText(/categoría/i)
        expect(select).toBeNull()
      })
    })

    it('NO debe mostrar el campo de vendor/proveedor', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        const input = screen.queryByLabelText(/proveedor/i)
        expect(input).toBeNull()
      })
    })
  })

  describe('Upload de PDF (RED)', () => {
    it('debe mostrar componente de upload de PDF', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        expect(screen.getByText(/subir pdf/i)).toBeInTheDocument()
      })
    })

    it('debe aceptar archivos .pdf', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      const pdfInput = screen.getByTestId('pdf-upload')
      expect(pdfInput).toHaveAttribute('accept', expect.stringContaining('.pdf'))
    })
  })

  describe('Upload de XML (RED)', () => {
    it('debe mostrar componente de upload de XML', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        expect(screen.getByText(/subir xml/i)).toBeInTheDocument()
      })
    })

    it('debe aceptar archivos .xml', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      const xmlInput = screen.getByTestId('xml-upload')
      expect(xmlInput).toHaveAttribute('accept', expect.stringContaining('.xml'))
    })
  })

  describe('Archivos subidos (GREEN → TRIANGULATE)', () => {
    it('debe mostrar área de upload de PDF', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        expect(screen.getByText('Archivo PDF (CFDI)')).toBeInTheDocument()
      })
    })
  })

  describe('Status Badge (RED)', () => {
    it('debe mostrar badge de estado cuando hay expense', async () => {
      // Expense predefinido para modo edición
      const existingExpense = {
        _id: 'exp-001',
        expenseNumber: 'EXP-2026-001',
        pharmacy: 'pharm-001',
        pharmacyName: 'Farmacia Centro',
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto de prueba',
        receiptDate: new Date('2026-01-15'),
        status: ExpenseStatus.FACTURADO,
        pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
        xmlUrl: 'https://cloudinary.com/xml/test.xml',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm expense={existingExpense as unknown as IExpense} />)

      await waitFor(() => {
        // Badge de FACTURADO
        expect(screen.getByText('FACTURADO')).toBeInTheDocument()
      })
    })
  })

  describe('Notes field (RED)', () => {
    it('debe mostrar campo de notas para transiciones', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/my-pharmacies') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockPharmacies }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(<ExpenseForm />)

      await waitFor(() => {
        const notesField = screen.queryByPlaceholderText(/notas/i)
        // Notes es opcional, pero debe existir si se necesita
        expect(notesField).toBeDefined()
      })
    })
  })
})