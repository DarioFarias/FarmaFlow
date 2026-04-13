import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import * as nextAuthReact from 'next-auth/react'

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('LoginForm', () => {
  const mockSignIn = nextAuthReact.signIn as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('renderiza el formulario de login', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrAR ahora/i })).toBeInTheDocument()
  })

  it('valida email inválido', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument()
    })
  })

  it('valida password menor a 8 caracteres', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'short')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    })
  })

  it('muestra error cuando credenciales son inválidas', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      error: 'CredentialsSignin',
      ok: false,
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({
          email: 'wrong@example.com',
          password: 'wrongpassword',
          redirect: false,
        })
      )
    })
  })

  it('redirige cuando credenciales son válidas', async () => {
    const user = userEvent.setup()
    const mockPush = vi.fn()
    const mockRefresh = vi.fn()

    vi.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
      }),
      useSearchParams: () => new URLSearchParams(),
    }))

    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(emailInput, 'valid@example.com')
    await user.type(passwordInput, 'validpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})