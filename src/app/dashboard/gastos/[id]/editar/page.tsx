'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { ExpenseForm } from '../../ExpenseForm'
import { IExpense, ExpenseStatus } from '@/types'
import { Loader2, Lock } from 'lucide-react'

export default function EditarGastoPage() {
  const params = useParams()
  const id = params.id as string

  const [expense, setExpense] = useState<IExpense | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<'not-found' | 'forbidden' | 'error' | null>(null)

  useEffect(() => {
    async function fetchExpense() {
      try {
        const res = await fetch(`/api/expenses/${id}`)

        if (res.status === 404) {
          setError('not-found')
          return
        }

        if (res.status === 403) {
          setError('forbidden')
          return
        }

        if (!res.ok) {
          setError('error')
          return
        }

        const json = await res.json()
        setExpense(json.data as IExpense)
      } catch (err) {
        console.error('Error fetching expense:', err)
        setError('error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpense()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  if (error === 'not-found' || (!expense && error !== 'forbidden')) {
    notFound()
  }

  if (error === 'forbidden' || (!expense && error === 'error')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">No tienes acceso a este gasto.</p>
      </div>
    )
  }

  // Check if expense is locked (not PENDIENTE_DE_FACTURAR)
  const isLocked = expense!.status !== ExpenseStatus.PENDIENTE_DE_FACTURAR

  if (isLocked) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editar Gasto</h1>
        </div>

        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Gasto bloqueado</h3>
            <p className="mt-2 text-sm text-gray-500">
              Este gasto ya fue aprobado y no puede editarse.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editar Gasto</h1>
        <p className="text-gray-500 mt-2 text-base">
          Modifica los datos del gasto.
        </p>
      </div>

      <ExpenseForm expense={expense!} />
    </div>
  )
}
