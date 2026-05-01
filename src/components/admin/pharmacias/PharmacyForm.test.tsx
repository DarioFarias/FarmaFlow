import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PharmacyForm } from './PharmacyForm'

// Mock de next-auth/react antes de importar el componente
const mockUseSession = vi.fn()
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    useSession: mockUseSession.mockReturnValue({
      data: { user: { role: 'SUPER_ADMIN', name: 'Test Admin' } },
      status: 'authenticated',
    }),
  }
})

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
}))

// Mock de next/link
vi.mock('next/link', ({ href, children }: any) => <a href={href}>{children}</a>)

// Mock de lib/roles
vi.mock('@/lib/roles', () => ({
  isAdmin: (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN',
}))

describe('PharmacyForm', () => {
  // Test 5.1: Render básico modo create
  describe('Render en modo create', () => {
    it('renderiza el formulario en modo creación', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('renderiza el campo de nombre de farmacia', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByLabelText(/Nombre de la Farmacia/i)).toBeInTheDocument()
    })

    it('renderiza el campo de dirección', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByLabelText(/Dirección/i)).toBeInTheDocument()
    })

    it('renderiza el campo de teléfono', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument()
    })

    it('renderiza el campo de email', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    })
  })

  // Test 5.2: Render básico modo edit
  describe('Render en modo edit', () => {
    it('renderiza el formulario en modo edición con datos iniciales', () => {
      const initialData = {
        pharmacyName: 'Farmacia Test',
        address: 'Calle Test 123',
        phone: '+54 11 1234 5678',
        email: 'test@farmacia.com',
        isActive: true,
      }
      render(<PharmacyForm initialData={initialData as any} isEditMode={true} />)
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('renderiza el campo de estado cuando está en modo edición', () => {
      const initialData = {
        pharmacyName: 'Farmacia Test',
        isActive: true,
      }
      render(<PharmacyForm initialData={initialData as any} isEditMode={true} />)
      expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument()
    })
  })

  // Test 5.3: Título cambia según isEditMode
  describe('Título dinámico', () => {
    it('muestra "Nueva Farmacia" en modo create', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByText('Nueva Farmacia')).toBeInTheDocument()
    })

    it('muestra "Editar Farmacia" en modo edit', () => {
      const initialData = { pharmacyName: 'Test', isActive: true }
      render(<PharmacyForm initialData={initialData as any} isEditMode={true} />)
      expect(screen.getByText('Editar Farmacia')).toBeInTheDocument()
    })
  })

  // Test 5.4: Validación de campo requerido
  describe('Validación de campo requerido', () => {
    it('require nombre para crear farmacia', async () => {
      const user = userEvent.setup()
      render(<PharmacyForm isEditMode={false} />)

      const nombreInput = screen.getByLabelText(/Nombre de la Farmacia/i)
      await user.clear(nombreInput)
      await user.click(screen.getByRole('button', { name: /Crear Farmacia/i }))

      // El campo nombre es requerido, el form debería mostrar error
      expect(nombreInput).toBeInvalid()
    })
  })

  // Test 5.5: Botón submit tiene texto correcto
  describe('Botón submit', () => {
    it('muestra "Crear Farmacia" en modo create', () => {
      render(<PharmacyForm isEditMode={false} />)
      expect(screen.getByRole('button', { name: /Crear Farmacia/i })).toBeInTheDocument()
    })

    it('muestra "Guardar Cambios" en modo edit', () => {
      const initialData = { pharmacyName: 'Test', isActive: true }
      render(<PharmacyForm initialData={initialData as any} isEditMode={true} />)
      expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeInTheDocument()
    })
  })
})