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

interface ExpenseTableProps {
  gastos: IExpenseResponse[]
  selectedIds: string[]
  isUserAdmin: boolean
  onToggleSelectAll: () => void
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
// Component: Desktop Expense Table
// =============================================
export function ExpenseTable({
  gastos,
  selectedIds,
  isUserAdmin,
  onToggleSelectAll,
  onToggleSelectOne,
}: ExpenseTableProps) {
  const isAllSelected = gastos.length > 0 && selectedIds.length === gastos.length

  return (
    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            {/* Batch Select All Checkbox */}
            <th className="py-3 px-4 w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
            </th>
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nº Gasto</th>
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Fecha</th>
            {isUserAdmin && (
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
            )}
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Descripción</th>
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Monto</th>
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
            <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Acciones</th>
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
              const isSelected = selectedIds.includes(g._id)
              return (
                <tr
                  key={g._id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors ${isSelected ? 'bg-brand-50/30' : ''}`}
                >
                  {/* Batch Select Checkbox */}
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectOne(g._id)}
                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-gray-900">
                    {g.expenseNumber}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {g.receiptDate
                      ? format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es })
                      : '-'}
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
                  {/* Status badge */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  {/* Edit button - only for PENDIENTE_DE_FACTURAR */}
                  <td className="py-3 px-4">
                    {g.status === ExpenseStatus.PENDIENTE_DE_FACTURAR ? (
                      <Link
                        href={`/dashboard/gastos/${g._id}/editar`}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Editar
                      </Link>
                    ) : null}
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
  )
}