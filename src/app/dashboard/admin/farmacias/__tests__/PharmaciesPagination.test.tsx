import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PharmaciesPagination } from '../PharmaciesPagination'
import '@testing-library/jest-dom'

describe('PharmaciesPagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    total: 100,
    isLoading: false,
    onPageChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pagination info', () => {
    render(<PharmaciesPagination {...defaultProps} />)
    
    // Verify page info exists by checking container has the text
    const container = document.querySelector('.text-gray-500')
    expect(container).toHaveTextContent('1')
    expect(container).toHaveTextContent('5')
    expect(container).toHaveTextContent('100')
  })

  it('should render prev and next buttons', () => {
    render(<PharmaciesPagination {...defaultProps} />)
    
    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.getByText('Siguiente')).toBeInTheDocument()
  })

  it('should disable prev button on first page', () => {
    render(<PharmaciesPagination {...defaultProps} page={1} />)
    
    const prevButton = screen.getByText('Anterior').closest('button')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(<PharmaciesPagination {...defaultProps} page={5} totalPages={5} />)
    
    const nextButton = screen.getByText('Siguiente').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('should enable prev button when not on first page', () => {
    render(<PharmaciesPagination {...defaultProps} page={3} />)
    
    const prevButton = screen.getByText('Anterior').closest('button')
    expect(prevButton).not.toBeDisabled()
  })

  it('should enable next button when not on last page', () => {
    render(<PharmaciesPagination {...defaultProps} page={3} totalPages={5} />)
    
    const nextButton = screen.getByText('Siguiente').closest('button')
    expect(nextButton).not.toBeDisabled()
  })

  it('should call onPageChange with page - 1 when prev clicked', () => {
    const onPageChange = vi.fn()
    render(<PharmaciesPagination {...defaultProps} page={3} onPageChange={onPageChange} />)
    
    const prevButton = screen.getByText('Anterior')
    fireEvent.click(prevButton)
    
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange with page + 1 when next clicked', () => {
    const onPageChange = vi.fn()
    render(<PharmaciesPagination {...defaultProps} page={3} onPageChange={onPageChange} />)
    
    const nextButton = screen.getByText('Siguiente')
    fireEvent.click(nextButton)
    
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('should disable buttons when loading', () => {
    render(<PharmaciesPagination {...defaultProps} isLoading={true} />)
    
    const prevButton = screen.getByText('Anterior').closest('button')
    const nextButton = screen.getByText('Siguiente').closest('button')
    
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('should not render when totalPages is 1', () => {
    render(<PharmaciesPagination {...defaultProps} totalPages={1} />)
    
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
  })

  it('should not render when total is 0', () => {
    render(<PharmaciesPagination {...defaultProps} total={0} totalPages={0} />)
    
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
  })

  it('should render correct page info for middle page', () => {
    render(<PharmaciesPagination {...defaultProps} page={3} totalPages={10} total={200} />)
    
    const container = document.querySelector('.text-gray-500')
    expect(container).toHaveTextContent('3')
    expect(container).toHaveTextContent('10')
    expect(container).toHaveTextContent('200')
  })

  it('should render correct total when total is less than page size', () => {
    render(<PharmaciesPagination {...defaultProps} page={1} totalPages={2} total={5} />)
    
    const container = document.querySelector('.text-gray-500')
    expect(container).toHaveTextContent('5')
  })
})