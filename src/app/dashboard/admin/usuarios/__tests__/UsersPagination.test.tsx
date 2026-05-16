import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import UsersPagination from '../UsersPagination'

describe('UsersPagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 1,
    isLoading: false,
    onPageChange: vi.fn(),
  }

  it('renders page info "Página X de Y"', () => {
    const props = { ...defaultProps, page: 2, totalPages: 5 }
    render(<UsersPagination {...props} />)

    expect(screen.getByText(/página 2 de 5/i)).toBeInTheDocument()
  })

  it('renders prev button', () => {
    const props = { ...defaultProps, page: 2, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    expect(prevButton).toBeInTheDocument()
  })

  it('renders next button', () => {
    const props = { ...defaultProps, page: 2, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const nextButton = screen.getByRole('button', { name: /siguiente página/i })
    expect(nextButton).toBeInTheDocument()
  })

  it('calls onPageChange with previous page when prev button is clicked', () => {
    const props = { ...defaultProps, page: 3, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    fireEvent.click(prevButton)

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with next page when next button is clicked', () => {
    const props = { ...defaultProps, page: 3, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const nextButton = screen.getByRole('button', { name: /siguiente página/i })
    fireEvent.click(nextButton)

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4)
  })

  it('disables prev button on first page', () => {
    const props = { ...defaultProps, page: 1, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    const props = { ...defaultProps, page: 5, totalPages: 5 }
    render(<UsersPagination {...props} />)

    const nextButton = screen.getByRole('button', { name: /siguiente página/i })
    expect(nextButton).toBeDisabled()
  })

  it('hides component when there is only one page', () => {
    const props = { ...defaultProps, page: 1, totalPages: 1 }
    const { container } = render(<UsersPagination {...props} />)

    expect(container.firstChild).toBeNull()
  })

  it('shows component when there are multiple pages', () => {
    const props = { ...defaultProps, page: 1, totalPages: 2 }
    render(<UsersPagination {...props} />)

    expect(screen.getByText(/página 1 de 2/i)).toBeInTheDocument()
  })

  it('disables buttons when isLoading is true', () => {
    const props = { ...defaultProps, page: 2, totalPages: 5, isLoading: true }
    render(<UsersPagination {...props} />)

    const prevButton = screen.getByRole('button', { name: /página anterior/i })
    const nextButton = screen.getByRole('button', { name: /siguiente página/i })

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  

  it('renders correct page info when on page 5 of 10', () => {
    const props = { ...defaultProps, page: 5, totalPages: 10 }
    render(<UsersPagination {...props} />)

    expect(screen.getByText(/página 5 de 10/i)).toBeInTheDocument()
  })
})