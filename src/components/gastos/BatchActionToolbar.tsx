'use client'

import { useState } from 'react'
import { Check, X, FileCheck, Send, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BatchActionToolbarProps {
  selectedIds: string[]
  currentFilter?: string
  onClear: () => void
}

type BatchAction = 'validate' | 'report' | 'return'

export function BatchActionToolbar({ 
  selectedIds, 
  currentFilter,
  onClear 
}: BatchActionToolbarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<BatchAction | null>(null)

  // Determine action based on current filter
  // Return null for PENDIENTE_DE_PAGO and PAID (no batch actions for these states)
  const getAction = (): BatchAction | null => {
    if (!currentFilter) return 'validate' // Default
    // PENDIENTE_DE_PAGO and PAID have no batch actions
    if (currentFilter === 'PENDIENTE_DE_PAGO' || currentFilter === 'PAID') return null
    // Order: most specific first
    if (currentFilter === 'REPORTED') return 'return'
    if (currentFilter === 'FACTURADO') return 'report'
    if (currentFilter === 'PENDIENTE_DE_FACTURAR') return 'validate'
    return 'validate'
  }

  const currentAction = action || getAction()

  // Hide toolbar entirely for PENDIENTE_DE_PAGO and PAID states
  if (currentFilter === 'PENDIENTE_DE_PAGO' || currentFilter === 'PAID') {
    if (selectedIds.length === 0) return null
    // Even if items are selected, hide for these states
    return null
  }

  const getActionLabel = () => {
    if (currentAction === 'validate') return 'Validar'
    if (currentAction === 'report') return 'Reportar a Contabilidad'
    if (currentAction === 'return') return 'Devolver a Farmacia'
    return 'Aprobar'
  }

  const getActionIcon = () => {
    if (currentAction === 'validate') return <FileCheck size={18} />
    if (currentAction === 'report') return <Send size={18} />
    return <RotateCcw size={18} />
  }

  const handleBatchAction = async () => {
    if (!selectedIds.length || !currentAction) return

    setIsLoading(true)
    try {
      const body: Record<string, unknown> = {
        action: currentAction,
        expenseIds: selectedIds,
      }

      // Add period for report action
      if (currentAction === 'report') {
        const now = new Date()
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        body.period = period
      }

      const res = await fetch('/api/expenses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Error en operación batch')

      toast.success(`${selectedIds.length} gasto(s) actualizado(s)`)
      onClear()
    } catch (error) {
      toast.error('Error al procesar operación')
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-3 md:p-4 flex items-center gap-2 md:gap-4 z-50">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {selectedIds.length} seleccionados
      </span>

      <div className="h-6 w-px bg-gray-200" />

<button
        onClick={handleBatchAction}
        disabled={isLoading}
        className="btn-primary flex items-center gap-2 min-w-0 flex-1 md:flex-none"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin shrink-0" />
        ) : (
          getActionIcon()
        )}
        <span className="truncate">{getActionLabel()}</span>
      </button>

      <div className="h-6 w-px bg-gray-200" />

      <button
        onClick={onClear}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <X size={18} />
      </button>
    </div>
  )
}