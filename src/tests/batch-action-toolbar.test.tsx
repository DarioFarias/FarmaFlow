/**
 * BatchActionToolbar - Tests
 * Phase 3 Task 3.4
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BatchActionToolbar } from '@/components/gastos/BatchActionToolbar'

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('BatchActionToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('no debe renderizar cuando no hay selección', () => {
    const { container } = render(
      <BatchActionToolbar selectedIds={[]} onClear={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('debe mostrar count cuando hay selección', () => {
    render(
      <BatchActionToolbar 
        selectedIds={['exp-001', 'exp-002']} 
        onClear={vi.fn()} 
      />
    )
    
    expect(screen.getByText('2 seleccionados')).toBeInTheDocument()
  })

  it('debe mostrar botón de limpiar', () => {
    const onClear = vi.fn()
    render(
      <BatchActionToolbar selectedIds={['exp-001']} onClear={onClear} />
    )
    
    // Encontrar el botón de X (con testid o buscar el segundo botón)
    const buttons = screen.getAllByRole('button')
    const clearBtn = buttons[1] // El segundo botón es el de limpiar
    clearBtn.click()
    expect(onClear).toHaveBeenCalled()
  })

  it('debe mostrar acción "Validar" para estado PENDIENTE_DE_FACTURAR', () => {
    render(
      <BatchActionToolbar 
        selectedIds={['exp-001']} 
        currentFilter="PENDIENTE_DE_FACTURAR"
        onClear={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Validar')).toBeInTheDocument()
  })

  it('debe mostrar acción "Reportar a Contabilidad" para estado FACTURADO', () => {
    render(
      <BatchActionToolbar 
        selectedIds={['exp-001']} 
        currentFilter="FACTURADO"
        onClear={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Reportar a Contabilidad')).toBeInTheDocument()
  })

  it('debe mostrar acción "Devolver a Farmacia" para estado REPORTED', () => {
    render(
      <BatchActionToolbar 
        selectedIds={['exp-001']} 
        currentFilter="REPORTED"
        onClear={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Devolver a Farmacia')).toBeInTheDocument()
  })
})