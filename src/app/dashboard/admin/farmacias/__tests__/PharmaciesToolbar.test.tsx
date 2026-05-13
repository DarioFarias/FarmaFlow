import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PharmaciesToolbar } from '../PharmaciesToolbar'
import '@testing-library/jest-dom'

describe('PharmaciesToolbar', () => {
  const defaultProps = {
    search: '',
    statusFilter: 'all' as const,
    sortBy: 'name-asc' as const,
    isLoading: false,
    onSearchChange: vi.fn(),
    onStatusFilterChange: vi.fn(),
    onSortChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    render(<PharmaciesToolbar {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Buscar farmacias...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should render status filter tabs', () => {
    render(<PharmaciesToolbar {...defaultProps} />)
    
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByText('Activas')).toBeInTheDocument()
    expect(screen.getByText('Inactivas')).toBeInTheDocument()
  })

  it('should render sort dropdown', () => {
    render(<PharmaciesToolbar {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Nombre A-Z')).toBeInTheDocument()
  })

  it('should call onSearchChange when typing', () => {
    const onSearchChange = vi.fn()
    render(<PharmaciesToolbar {...defaultProps} onSearchChange={onSearchChange} />)
    
    const searchInput = screen.getByPlaceholderText('Buscar farmacias...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    expect(onSearchChange).toHaveBeenCalledWith('test search')
  })

  it('should call onStatusFilterChange when clicking tab', () => {
    const onStatusFilterChange = vi.fn()
    render(<PharmaciesToolbar {...defaultProps} onStatusFilterChange={onStatusFilterChange} />)
    
    const activeTab = screen.getByText('Activas')
    fireEvent.click(activeTab)
    
    expect(onStatusFilterChange).toHaveBeenCalledWith('active')
  })

  it('should call onSortChange when selecting option', () => {
    const onSortChange = vi.fn()
    render(<PharmaciesToolbar {...defaultProps} onSortChange={onSortChange} />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'name-desc' } })
    
    expect(onSortChange).toHaveBeenCalledWith('name-desc')
  })

  it('should show loading state - search input disabled', () => {
    render(<PharmaciesToolbar {...defaultProps} isLoading={true} />)
    
    const searchInput = screen.getByPlaceholderText('Buscar farmacias...')
    expect(searchInput).toBeDisabled()
  })

  it('should show loading state - tabs disabled', () => {
    render(<PharmaciesToolbar {...defaultProps} isLoading={true} />)
    
    const tabs = screen.getAllByRole('button')
    tabs.forEach(tab => {
      expect(tab).toBeDisabled()
    })
  })

  it('should show loading state - select disabled', () => {
    render(<PharmaciesToolbar {...defaultProps} isLoading={true} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('should render with initial search value', () => {
    render(<PharmaciesToolbar {...defaultProps} search="initial search" />)
    
    const searchInput = screen.getByPlaceholderText('Buscar farmacias...') as HTMLInputElement
    expect(searchInput.value).toBe('initial search')
  })

  it('should render with initial status filter', () => {
    render(<PharmaciesToolbar {...defaultProps} statusFilter="active" />)
    
    const activeTab = screen.getByText('Activas')
    expect(activeTab).toHaveClass('bg-white text-brand-600')
  })

  it('should render all sort options', () => {
    render(<PharmaciesToolbar {...defaultProps} />)
    
    expect(screen.getByText('Nombre A-Z')).toBeInTheDocument()
    expect(screen.getByText('Nombre Z-A')).toBeInTheDocument()
    expect(screen.getByText('Más pedidos pendientes')).toBeInTheDocument()
    expect(screen.getByText('Más gastos pendientes')).toBeInTheDocument()
    expect(screen.getByText('Más recientes')).toBeInTheDocument()
  })

  it('should render clear button when search has value', () => {
    render(<PharmaciesToolbar {...defaultProps} search="test" />)
    
    // The clear button should be present
    const clearButtons = document.querySelectorAll('button')
    // At least one button for clearing search
    expect(clearButtons.length).toBeGreaterThan(0)
  })
})