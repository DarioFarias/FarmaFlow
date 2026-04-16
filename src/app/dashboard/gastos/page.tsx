import Link from 'next/link'
import { Receipt, Plus, Eye } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole, ExpenseStatus, IPharmacy } from '@/types'
import { isAdmin } from '@/lib/roles'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AuditActions } from '@/components/audit/AuditActions'
import Pharmacy from '@/models/Pharmacy'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [ExpenseStatus.PENDING]: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  [ExpenseStatus.APPROVED]: { label: 'Aprobado', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  [ExpenseStatus.REVIEWED]: { label: 'Revisado', classes: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  [ExpenseStatus.DISPUTED]: { label: 'Disputado', classes: 'bg-red-50 text-red-700 ring-red-600/20' },
}

export default async function GastosPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  let query = {}
  if (session?.user) {
    const userRole = session.user.role as UserRole
    const isUserAdmin = isAdmin(userRole)
    
    if (!isUserAdmin) {
      // No-admin: filtrar por assignedPharmacies
      const assignedPharmacies = (session.user as any).assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        // Obtener los IDs de las farmacias asignadas
        const pharmacies = await Pharmacy.find({ pharmacyCode: { $in: assignedPharmacies } }).select('_id')
        const pharmacyIds = pharmacies.map(p => p._id)
        query = { pharmacy: { $in: pharmacyIds } }
      } else {
        query = { pharmacy: null } // No tiene farmacias asignadas
      }
    }
  }

  const gastos = await Expense.find(query).sort({ receiptDate: -1 })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Auditoría de Gastos</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona la rendición de cuentas y comprobantes.</p>
        </div>
        <Link href="/dashboard/gastos/nuevo" className="btn-primary flex items-center gap-2 font-semibold">
          <Plus size={18} />
          Rendir Gasto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Fecha Ticket</th>
              {isAdmin(session?.user.role as UserRole) && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
              )}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Categoría</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Descripción</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Monto</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Estado</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={isAdmin(session?.user.role as UserRole) ? 7 : 6} className="py-12 text-center text-gray-400 italic text-sm">
                  <Receipt size={32} className="mx-auto mb-3 text-gray-200" />
                  No hay gastos registrados por el momento.
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
                return (
                  <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-4 text-xs font-medium text-gray-500">
                      {format(new Date(g.receiptDate), 'dd/MM/yyyy')}
                    </td>
                    {isAdmin(session?.user.role as UserRole) && (
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {g.pharmacyName}
                      </td>
                    )}
                    <td className="py-4 px-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium uppercase tracking-tight">
                        {g.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {g.description}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-gray-900 text-right">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: g.currency }).format(g.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ring-1 ring-inset ${statusInfo.classes}`}>
                        {statusInfo.label.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                      {g.invoiceImageUrl && (
                        <a 
                          href={g.invoiceImageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg inline-block transition-colors"
                          title="Ver Comprobante"
                        >
                          <Eye size={16} />
                        </a>
                      )}
                      {isAdmin(session?.user.role as UserRole) && (
                        <AuditActions id={g.id.toString()} type="expense" currentStatus={g.status} />
                      )}
                    </td>
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
