'use client'

import { MapPin, Phone, Mail, Calendar, Package, DollarSign, Users } from 'lucide-react'
import type { PharmacyDetailsModalProps } from './types'

export default function PharmacyDetailsModal({
  isOpen,
  pharmacy,
  onClose,
  onEdit,
}: PharmacyDetailsModalProps) {
  if (!isOpen || !pharmacy) return null

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const formatDate = (date: string | Date): string => {
    const d = new Date(date)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Detalles de Farmacia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Name & Status */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {pharmacy.pharmacyName}
              </h3>
              <p className="text-sm text-gray-500">
                ID: {String(pharmacy._id).slice(-8)}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                pharmacy.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {pharmacy.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase">
              Información de Contacto
            </h4>
            {pharmacy.address && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin size={18} className="text-gray-400" />
                <span>{pharmacy.address}</span>
              </div>
            )}
            {pharmacy.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone size={18} className="text-gray-400" />
                <span>{pharmacy.phone}</span>
              </div>
            )}
            {pharmacy.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail size={18} className="text-gray-400" />
                <span>{pharmacy.email}</span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Package size={16} />
                <span className="text-xs font-medium">Pedidos Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {pharmacy.pendingSupplyRequests}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign size={16} />
                <span className="text-xs font-medium">Gastos Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {pharmacy.pendingExpenses}
              </p>
            </div>
          </div>

          {/* Assigned Users */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <Users size={16} />
              Usuarios Asignados
            </h4>
            {pharmacy.assignedUsers && pharmacy.assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {pharmacy.assignedUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Sin usuarios asignados
              </p>
            )}
          </div>

          {/* Monthly Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Resumen del Mes
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Gastos</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(pharmacy.monthlySummary?.totalExpensesThisMonth || 0)}
                </p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Entregados</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pharmacy.monthlySummary?.deliveredOrders || 0}
                </p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Usuarios</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pharmacy.monthlySummary?.activeUsers || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t">
            <p>Creada: {formatDate(pharmacy.createdAt)}</p>
            <p>Última actualización: {formatDate(pharmacy.updatedAt)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => onEdit(pharmacy)}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}