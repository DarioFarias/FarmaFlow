'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Edit2 } from 'lucide-react'
import { ExpenseStatus } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'
import { AuditActions } from '@/components/audit/AuditActions'

// =============================================
// Types
// =============================================

interface ExpenseCardsProps {
  gastos: IExpenseResponse[]
  selectedIds: string[]
  isUserAdmin: boolean
  onToggleSelectOne: (id: string) => void
}

// =============================================
// STATUS_CONFIG - Same as original page (out of scope to extract)
// =============================================
const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [ExpenseStatus.PENDIENTE_DE_FACTURAR]: {
    label: 'Pendiente de Facturar',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/20'
  },
  [ExpenseStatus.FACTURADO]: {
    label: 'Facturado',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20'
  },
  [ExpenseStatus.REPORTED]: {
    label: 'Reportado',
    classes: 'bg-purple-50 text-purple-700 ring-purple-600/20'
  },
  [ExpenseStatus.PENDIENTE_DE_PAGO]: {
    label: 'Pendiente de Pago',
    classes: 'bg-orange-50 text-orange-700 ring-orange-600/20'
  },
  [ExpenseStatus.PAID]: {
    label: 'Pagado',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  },
}

// =============================================
// Component: Mobile Expense Cards
// =============================================
export function ExpenseCards({
  gastos,
  selectedIds,
  isUserAdmin,
  onToggleSelectOne,
}: ExpenseCardsProps) {
  return (
    <div className="block md:hidden space-y-3">
      {gastos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-sm italic">No hay gastos registrados todavía.</p>
        </div>
      ) : (
        gastos.map((g) => {
          const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
          const isSelected = selectedIds.includes(g._id)
          return (
            <div
              key={g._id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 ${isSelected ? 'bg-brand-50/30 border-brand-200' : ''}`}
            >
              {/* Header with checkbox and expense number */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelectOne(g._id)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  data-testid={`expense-checkbox-${g._id}`}
                />
                <span className="font-bold text-gray-900">{g.expenseNumber}</span>
                <span className={`ml-auto inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Fecha</span>
                  <p className="text-gray-900">
                    {g.receiptDate
                      ? format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es })
                      : '-'}
                  </p>
                </div>
                {isUserAdmin && (
                  <div>
                    <span className="text-gray-500 text-xs">Sucursal</span>
                    <p className="text-gray-900">{g.pharmacyName}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Descripción</span>
                  <p className="text-gray-900 truncate">{g.description}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Monto</span>
                  <p className="font-medium text-gray-900">
                    {g.currency} {g.amount.toLocaleString('es-MX')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                {g.status === ExpenseStatus.PENDIENTE_DE_FACTURAR && (
                  <Link
                    href={`/dashboard/gastos/${g._id}/editar`}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <Edit2 size={14} />
                    Editar
                  </Link>
                )}
                {isUserAdmin && (
                  <div className="ml-auto">
                    <AuditActions id={g._id} type="expense" currentStatus={g.status} />
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}