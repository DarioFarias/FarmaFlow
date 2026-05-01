'use client'

import { IPharmacyMetrics } from '@/types/api-responses'
import { MapPin, Phone, Mail, Calendar, Package, DollarSign, Users, TrendingUp } from 'lucide-react'

// =============================================
// PharmacyView Component
// Displays pharmacy details in read-only mode (view mode)
// Used by /dashboard/admin/farmacias/[id]/page.tsx
// =============================================

interface PharmacyViewProps {
  pharmacy: IPharmacyMetrics
}

// Helper for Mexican date format: dd/mm/yyyy
const formatDateMX = (date: string | Date): string => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper for Mexican phone format: +52 XXX XXX XXXX
const formatPhoneMX = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    // Format as +52 XXX XXX XXXX
    return `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone // Return original if not 10 digits
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function PharmacyView({ pharmacy }: PharmacyViewProps) {
  const {
    _id,
    pharmacyName,
    address,
    phone,
    email,
    isActive,
    pendingSupplyRequests,
    pendingExpenses,
    assignedUsers,
    monthlySummary,
    createdAt,
  } = pharmacy

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
              ID: {String(_id).slice(-8)}
            </span>
          </div>
          {isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              Farmacia Activa
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
              Farmacia Inactiva
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{pharmacyName}</h1>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {address && (
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Dirección</p>
                <p className="text-sm text-gray-900">{address}</p>
              </div>
            </div>
          )}

          {phone && (
            <div className="flex items-start gap-3 text-gray-600">
              <Phone className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Teléfono</p>
                <p className="text-sm text-gray-900">{formatPhoneMX(phone)}</p>
              </div>
            </div>
          )}

          {email && (
            <div className="flex items-start gap-3 text-gray-600">
              <Mail className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Correo Electrónico</p>
                <p className="text-sm text-gray-900">{email}</p>
              </div>
            </div>
          )}

          {createdAt && (
            <div className="flex items-start gap-3 text-gray-600">
              <Calendar className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Fecha de Creación</p>
                <p className="text-sm text-gray-900">{formatDateMX(createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${pendingSupplyRequests > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Package className={`w-5 h-5 ${pendingSupplyRequests > 0 ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Pedidos Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingSupplyRequests}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {pendingSupplyRequests === 0
              ? 'Sin pedidos pendientes'
              : pendingSupplyRequests === 1
              ? '1 pedido requiere atención'
              : `${pendingSupplyRequests} pedidos requieren atención`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${pendingExpenses > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
              <DollarSign className={`w-5 h-5 ${pendingExpenses > 0 ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Gastos Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingExpenses}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {pendingExpenses === 0
              ? 'Sin gastos pendientes'
              : pendingExpenses === 1
              ? '1 gasto requiere validación'
              : `${pendingExpenses} gastos requieren validación`}
          </p>
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">Resumen del Mes</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Total Gastos</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(monthlySummary?.totalExpensesThisMonth || 0)}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Pedidos Entregados</p>
            <p className="text-lg font-bold text-gray-900">{monthlySummary?.deliveredOrders || 0}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Usuarios Activos</p>
            <p className="text-lg font-bold text-gray-900">{monthlySummary?.activeUsers || 0}</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Última Actividad</p>
            <p className="text-lg font-bold text-gray-900">
              {monthlySummary?.lastActivity
                ? formatDateMX(monthlySummary.lastActivity)
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Users Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">Usuarios Asignados</h2>
        </div>

        {assignedUsers && assignedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase py-2 px-3">Nombre</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase py-2 px-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {assignedUsers.map((user, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-3 text-sm text-gray-900">{user.name}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No hay usuarios asignados a esta farmacia
          </p>
        )}
      </div>
    </div>
  )
}