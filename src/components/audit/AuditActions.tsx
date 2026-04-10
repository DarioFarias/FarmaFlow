'use client'

import { useState } from 'react'
import { Check, X, Truck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface AuditActionsProps {
  id: string
  type: 'supply' | 'expense'
  currentStatus: string
}

export function AuditActions({ id, type, currentStatus }: AuditActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (newStatus: string, comment?: string) => {
    setIsLoading(newStatus)
    try {
      const endpoint = type === 'supply' ? `/api/supplies/${id}` : `/api/expenses/${id}`
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminComment: comment, rejectionReason: comment }),
      })

      if (!res.ok) throw new Error('Error al actualizar')

      toast.success(`Estado actualizado a ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error('Error al procesar la acción')
    } finally {
      setIsLoading(null)
    }
  }

  const promptReject = () => {
    const reason = prompt('Motivo del rechazo:')
    if (reason) {
      handleAction('REJECTED', reason)
    }
  }

  if (type === 'supply') {
    if (currentStatus === 'RECEIVED' || currentStatus === 'REJECTED') return null

    return (
      <div className="flex items-center gap-2">
        {currentStatus === 'REQUESTED' && (
          <>
            <button 
              onClick={() => handleAction('AUTHORIZED')}
              disabled={!!isLoading}
              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Autorizar"
            >
              {isLoading === 'AUTHORIZED' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button 
              onClick={promptReject}
              disabled={!!isLoading}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Rechazar"
            >
              <X size={16} />
            </button>
          </>
        )}
        {currentStatus === 'AUTHORIZED' && (
          <button 
            onClick={() => handleAction('SHIPPED')}
            disabled={!!isLoading}
            className="p-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
            title="Marcar como Enviado"
          >
            {isLoading === 'SHIPPED' ? <Loader2 size={16} className="animate-spin" /> : <><Truck size={14} /> ENVIAR</>}
          </button>
        )}
      </div>
    )
  }

  // Expense Actions
  if (type === 'expense' && currentStatus === 'PENDING') {
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => handleAction('APPROVED')}
          disabled={!!isLoading}
          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
          title="Aprobar Gasto"
        >
          {isLoading === 'APPROVED' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
        <button 
          onClick={promptReject}
          disabled={!!isLoading}
          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Rechazar Gasto"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return null
}
