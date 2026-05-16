import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Search, Plus } from 'lucide-react'
import UsersToolbar from '../UsersToolbar'

describe('UsersToolbar', () => {
  const defaultProps = {
    search: '',
    isLoading: false,
    onSearchChange: vi.fn(),
    onCreateClick: vi.fn(),
  }

  it('renders search input', () => {
    render(<UsersToolbar {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders "Nuevo Usuario" button', () => {
    render(<UsersToolbar {...defaultProps} />)
    const createButton = screen.getByRole('button', { name: /nuevo usuario/i })
    expect(createButton).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search input', () => {
    render(<UsersToolbar {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)

    fireEvent.change(searchInput, { target: { value: 'test query' } })

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test query')
  })

  it('calls onSearchChange with empty string when clear button is clicked', () => {
    const props = { ...defaultProps, search: 'test query' }
    render(<UsersToolbar {...props} />)

    const clearButton = screen.getByRole('button', { name: /limpiar/i })
    fireEvent.click(clearButton)

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('')
  })

  it('shows clear button when search has value', () => {
    const props = { ...defaultProps, search: 'some text' }
    render(<UsersToolbar {...props} />)

    const clearButton = screen.getByRole('button', { name: /limpiar/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('hides clear button when search is empty', () => {
    render(<UsersToolbar {...defaultProps} />)

    expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument()
  })

  it('disables search input when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true }
    render(<UsersToolbar {...props} />)

    const searchInput = screen.getByPlaceholderText(/buscar/i)
    expect(searchInput).toBeDisabled()
  })

  it('disables create button when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true }
    render(<UsersToolbar {...props} />)

    const createButton = screen.getByRole('button', { name: /nuevo usuario/i })
    expect(createButton).toBeDisabled()
  })

  it('calls onCreateClick when "Nuevo Usuario" button is clicked', () => {
    render(<UsersToolbar {...defaultProps} />)

    const createButton = screen.getByRole('button', { name: /nuevo usuario/i })
    fireEvent.click(createButton)

    expect(defaultProps.onCreateClick).toHaveBeenCalled()
  })

  it('displays current search value in input', () => {
    const props = { ...defaultProps, search: 'existing search' }
    render(<UsersToolbar {...props} />)

    const searchInput = screen.getByPlaceholderText(/buscar/i) as HTMLInputElement
    expect(searchInput.value).toBe('existing search')
  })
})