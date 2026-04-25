'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Receipt, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserRole, ExpenseStatus } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'
import { AuditActions } from '@/components/audit/AuditActions'

const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [ExpenseStatus.PENDING]: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  [ExpenseStatus.APPROVED]: { label: 'Aprobado', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  [ExpenseStatus.REVIEWED]: { label: 'Revisado', classes: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  [ExpenseStatus.DISPUTED]: { label: 'Disputado', classes: 'bg-red-50 text-red-700 ring-red-600/20' },
}

// Helper para verificar si es admin
function isAdminUser(role?: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR
}

export default function GastosPage() {
  const { data: session } = useSession()
  const [gastos, setGastos] = useState<IExpenseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userRole = session?.user?.role as UserRole | undefined
  const isUserAdmin = isAdminUser(userRole)

  useEffect(() => {
    fetchGastos()
  }, [])

  const fetchGastos = async () => {
    try {
      const res = await fetch('/api/expenses')
      const data = await res.json()
      
      let items: IExpenseResponse[] = []
      if (data && Array.isArray(data.data)) {
        items = data.data as IExpenseResponse[]
      } else if (Array.isArray(data)) {
        items = data as IExpenseResponse[]
      }

      setGastos(items)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gastos</h1>
          <p className="text-gray-500 mt-1 text-sm">Registra y gestiona los gastos operativos.</p>
        </div>
        <Link href="/dashboard/gastos/nuevo" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuevo Gasto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nº Gasto</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Fecha</th>
              {isUserAdmin && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
              )}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Descripción</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Monto</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Categoría</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
              {isUserAdmin && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Auditoría</th>
              )}
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={isUserAdmin ? 8 : 6} className="py-12 text-center">
                  <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm italic">No hay gastos registrados todavía.</p>
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
                return (
                  <tr key={g._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">
                      {g.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es })}
                    </td>
                    {isUserAdmin && (
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {g.pharmacyName}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-900 max-w-[200px] truncate">
                      {g.description}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {g.currency} {g.amount.toLocaleString('es-MX')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {g.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    {isUserAdmin && (
                      <td className="py-3 px-4">
                        <AuditActions id={g._id} type="expense" currentStatus={g.status} />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}