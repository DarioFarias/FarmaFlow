/**
 * PeriodSelector - Tests
 * Phase 3 Task 3.3
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PeriodSelector } from '@/components/gastos/PeriodSelector'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ 
    data: { user: { role: 'SUPERVISOR' } }, 
    status: 'authenticated' 
  }),
}))

const mockPeriods = [
  { value: '', label: 'Sin período' },
  { value: '2026-01', label: 'Enero 2026' },
  { value: '2026-02', label: 'Febrero 2026' },
  { value: '2026-03', label: 'Marzo 2026' },
]

describe('PeriodSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar dropdown con opciones de período', () => {
    const onChange = vi.fn()
    render(<PeriodSelector value="" onChange={onChange} />)
    
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('debe mostrar todas las opciones de período', async () => {
    const onChange = vi.fn()
    render(<PeriodSelector value="" onChange={onChange} />)
    
    await waitFor(() => {
      expect(screen.getByText('Sin período')).toBeInTheDocument()
      expect(screen.getByText('Enero 2026')).toBeInTheDocument()
      expect(screen.getByText('Febrero 2026')).toBeInTheDocument()
    })
  })

  it('debe llamar onChange al seleccionar período', async () => {
    const onChange = vi.fn()
    render(<PeriodSelector value="" onChange={onChange} />)
    
    const select = screen.getByRole('combobox')
    select.value = '2026-01'
    // Trigger change
    select.dispatchEvent(new Event('change', { bubbles: true }))
    
    expect(onChange).toHaveBeenCalledWith('2026-01')
  })
})