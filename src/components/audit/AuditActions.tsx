'use client'

import { useState } from 'react'
import { Check, X, Truck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ExpenseStatus } from '@/types'

interface AuditActionsProps {
  id: string
  type: 'supply' | 'expense'
  currentStatus: string
}

export function AuditActions({ id, type, currentStatus }: AuditActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()

  const handleStatusChange = async (newStatus: string, comment?: string) => {
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

  const handleApprove = async () => {
    setIsLoading('FACTURADO')
    try {
      const endpoint = `/api/expenses/${id}`
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ExpenseStatus.FACTURADO }),
      })

      if (!res.ok) throw new Error('Error al aprobar')

      toast.success('Gasto aprobado')
      router.refresh()
    } catch (error) {
      toast.error('Error al procesar la acción')
    } finally {
      setIsLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor ingresa un motivo de rechazo')
      return
    }
    setIsLoading('rejected')
    try {
      const endpoint = `/api/expenses/${id}`
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminComment: rejectReason.trim() }),
      })

      if (!res.ok) throw new Error('Error al rechazar')

      toast.success('Gasto rechazado')
      router.refresh()
      setIsRejecting(false)
      setRejectReason('')
    } catch (error) {
      toast.error('Error al procesar la acción')
    } finally {
      setIsLoading(null)
    }
  }

  if (type === 'supply') {
    if (currentStatus === 'RECEIVED' || currentStatus === 'REJECTED') return null

    const handleSupplyReject = async () => {
      if (!rejectReason.trim()) {
        toast.error('Por favor ingresa un motivo')
        return
      }
      setIsLoading('rejected')
      try {
        const res = await fetch(`/api/supplies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', rejectionReason: rejectReason.trim() }),
        })
        if (!res.ok) throw new Error('Error al rechazar')
        toast.success('Solicitud rechazada')
        router.refresh()
        setIsRejecting(false)
        setRejectReason('')
      } catch (error) {
        toast.error('Error al procesar')
      } finally {
        setIsLoading(null)
      }
    }

    // Supply reject with inline input
    if (currentStatus === 'REQUESTED' && isRejecting) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo..."
            className="w-24 text-xs px-2 py-1 border rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleSupplyReject()}
          />
          <button
            onClick={handleSupplyReject}
            disabled={isLoading === 'rejected'}
            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
          >
            {isLoading === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </button>
          <button
            onClick={() => { setIsRejecting(false); setRejectReason('') }}
            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {currentStatus === 'REQUESTED' && (
          <>
            <button 
              onClick={() => handleStatusChange('AUTHORIZED')}
              disabled={!!isLoading}
              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Autorizar"
            >
              {isLoading === 'AUTHORIZED' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button 
              onClick={() => setIsRejecting(true)}
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
            onClick={() => handleStatusChange('SHIPPED')}
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
  if (type === 'expense') {
    // Show badge for FACTURADO and beyond
    if (currentStatus === ExpenseStatus.FACTURADO || 
        currentStatus === ExpenseStatus.REPORTED ||
        currentStatus === ExpenseStatus.PENDIENTE_DE_PAGO ||
        currentStatus === ExpenseStatus.PAID) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Facturado
        </span>
      )
    }

    // Show approve/reject for PENDIENTE_DE_FACTURAR
    if (currentStatus === ExpenseStatus.PENDIENTE_DE_FACTURAR) {
      if (isRejecting) {
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              className="w-32 text-xs px-2 py-1 border rounded-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleReject()}
            />
            <button
              onClick={handleReject}
              disabled={isLoading === 'rejected'}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Confirmar rechazo"
            >
              {isLoading === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button
              onClick={() => { setIsRejecting(false); setRejectReason('') }}
              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={!!isLoading}
            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
            title="Aprobar Gasto"
          >
            {isLoading === 'FACTURADO' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </button>
          <button
            onClick={() => setIsRejecting(true)}
            disabled={!!isLoading}
            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Rechazar Gasto"
          >
            <X size={16} />
          </button>
        </div>
      )
    }
  }

  return null
}
