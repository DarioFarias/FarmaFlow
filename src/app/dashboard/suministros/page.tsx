import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole, SupplyRequestStatus, IPharmacy } from '@/types'
import { isAdmin } from '@/lib/roles'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AuditActions } from '@/components/audit/AuditActions'
import Pharmacy from '@/models/Pharmacy'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [SupplyRequestStatus.REQUESTED]: { label: 'Pedido', classes: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  [SupplyRequestStatus.APPROVED]: { label: 'Aprobado', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  [SupplyRequestStatus.SHIPPED]: { label: 'En camino', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  [SupplyRequestStatus.DELIVERED]: { label: 'Recibido', classes: 'bg-gray-50 text-gray-700 ring-gray-600/20' },
  [SupplyRequestStatus.REJECTED]: { label: 'Rechazado', classes: 'bg-red-50 text-red-700 ring-red-600/20' },
}

export default async function SuministrosPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  let query = {}
  if (session?.user) {
    const userRole = session.user.role as UserRole
    const isUserAdmin = isAdmin(userRole)
    
    if (!isUserAdmin) {
      // No-admin: filtrar por assignedPharmacies
      const assignedPharmacies = session.user.assignedPharmacies || []
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

  const pedidos = await SupplyRequest.find(query).sort({ createdAt: -1 })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suministros</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona los pedidos de insumos y sus estados.</p>
        </div>
        <Link href="/dashboard/suministros/nuevo" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuevo Pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nº Pedido</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Fecha</th>
              {isAdmin(session?.user.role as UserRole) && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
              )}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Ítems</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Prioridad</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
              {isAdmin(session?.user.role as UserRole) && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Auditoría</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={isAdmin(session?.user.role as UserRole) ? 7 : 5} className="py-12 text-center">
                  <Package size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm italic">No hay pedidos registrados todavía.</p>
                </td>
              </tr>
            ) : (
              pedidos.map((p) => {
                const statusInfo = STATUS_CONFIG[p.status] || { label: p.status, classes: 'bg-gray-50' }
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">
                      {p.requestNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {format(new Date(p.createdAt), 'dd MMM, HH:mm', { locale: es })}
                    </td>
                    {isAdmin(session?.user.role as UserRole) && (
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {p.pharmacyName}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-900 font-medium">
                          {p.items.length} {p.items.length === 1 ? 'ítem' : 'ítems'}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          {p.items.map(i => i.name).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        p.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    {isAdmin(session?.user.role as UserRole) && (
                      <td className="py-3 px-4">
                        <AuditActions id={p._id.toString()} type="supply" currentStatus={p.status} />
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
