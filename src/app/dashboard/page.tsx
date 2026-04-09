import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types'
import { Package, Receipt, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
// import SupplyRequest from '@/models/SupplyRequest'
// import Expense from '@/models/Expense'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user.role === UserRole.ADMIN

  await connectDB()

  // Conteo real si es Admin
  const farmaciasCount = isAdmin ? await User.countDocuments({ role: UserRole.PHARMACY, isActive: true }) : 0
  
  // Próximamente traeremos esto de la DB
  const activeSupplyCount = 0
  const pendingExpenseCount = 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Resumen General
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdmin
              ? 'Métricas clave de todas las farmacias y auditorías.'
              : 'Estado de tus últimos pedidos y reportes.'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Pedidos activos', value: activeSupplyCount.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
          { label: 'Gastos pendientes', value: pendingExpenseCount.toString(), icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-100' },
          ...(isAdmin
            ? [
                { label: 'Farmacias activas', value: farmaciasCount.toString(), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50', ring: 'ring-brand-100' },
                { label: 'Crecimiento', value: '+14%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
              ]
            : []),
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500`}>
              <stat.icon size={80} className={stat.color} />
            </div>
            <div className={`inline-flex ${stat.bg} ${stat.color} ring-1 ${stat.ring} p-2.5 rounded-lg mb-4`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">Actividad Reciente</h2>
            </div>
            <div className="p-8 text-center text-gray-500">
              <Package size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hay actividad reciente para mostrar</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/suministros/nuevo" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm hover:shadow-md outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <Package size={16} />
                Nuevo pedido
              </Link>
              <Link href="/dashboard/gastos/nuevo" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all font-medium outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <Receipt size={16} />
                Registrar gasto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
