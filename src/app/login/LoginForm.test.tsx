import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import * as nextAuthReact from 'next-auth/react'

// Mocks globales
const mockPush = vi.fn()
const mockRefresh = vi.fn()

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
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
    mockPush.mockClear()
    mockRefresh.mockClear()
  })

  it('renderiza el formulario de login', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrAR ahora/i })).toBeInTheDocument()
  })

  it('valida username inválido (menos de 3 caracteres)', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/nombre de usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(usernameInput, 'ab')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/al menos 3 caracteres/i)).toBeInTheDocument()
    })
  })

  it('valida password menor a 8 caracteres', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/nombre de usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(usernameInput, 'testuser')
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

    const usernameInput = screen.getByLabelText(/nombre de usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(usernameInput, 'wronguser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({
          username: 'wronguser',
          password: 'wrongpassword',
          redirect: false,
        })
      )
    })
  })

  it('redirige cuando credenciales son válidas', async () => {
    const user = userEvent.setup()

    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
    })

    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/nombre de usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /entrAR ahora/i })

    await user.type(usernameInput, 'validuser')
    await user.type(passwordInput, 'validpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})