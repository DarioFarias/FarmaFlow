'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Phone, Mail, ChevronDown, ChevronUp, Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
import { IPharmacyMetrics } from '@/types/api-responses'
import { useSession } from 'next-auth/react'
import { UserRole } from '@/types'
import { toast } from 'react-hot-toast'

// =============================================
// PharmacyCard Component
// Displays pharmacy info with color-coded metrics badges
// =============================================

// Color thresholds for metrics
const getMetricColor = (count: number): string => {
  if (count === 0) return 'bg-green-100 text-green-800'
  if (count <= 2) return 'bg-yellow-100 text-yellow-800'
  if (count <= 5) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

interface PharmacyCardProps {
  pharmacy: IPharmacyMetrics
}

export function PharmacyCard({ pharmacy }: PharmacyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  // Verificar permisos de usuario
  // - ADMIN/SUPER_ADMIN: pueden VER y EDITAR
  // - SUPERVISOR: solo puede VER (no editar)
  // - VENDEDOR/ENCARGADO: sin acceso
  const userRole = session?.user?.role as UserRole | undefined
  const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN
  const isSupervisor = userRole === UserRole.SUPERVISOR
  const canView = isAdmin || isSupervisor // ADMIN, SUPER_ADMIN y SUPERVISOR pueden ver
  const canEdit = isAdmin // Solo ADMIN y SUPER_ADMIN pueden editar
  const canDelete = userRole === UserRole.SUPER_ADMIN

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
  } = pharmacy

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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/pharmacies/${_id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar farmacia')
      }
      toast.success('Farmacia eliminada correctamente')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar farmacia')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
            ID: {String(_id).slice(-8)}
          </span>
        </div>
        {isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
            Activa
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
            Inactiva
          </span>
        )}
      </div>

      {/* Pharmacy Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{pharmacyName}</h3>

      {/* Metrics Badges */}
      <div className="flex gap-2 mb-3">
        <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricColor(pendingSupplyRequests)}`}>
          <span className="text-gray-600 mr-1">Pedidos:</span>
          <span className="font-semibold">{pendingSupplyRequests}</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getMetricColor(pendingExpenses)}`}>
          <span className="text-gray-600 mr-1">Gastos:</span>
          <span className="font-semibold">{pendingExpenses}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 text-sm text-gray-500 mb-4">
        {address && (
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>{address}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2">
            <Mail size={14} />
            <span>{email}</span>
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
      >
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            <span>Ocultar</span>
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            <span>Ver más</span>
          </>
        )}
      </button>

      {/* Expanded Content - Accordion */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2">
          {/* Assigned Users */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Usuarios Asignados
            </h4>
            {assignedUsers && assignedUsers.length > 0 ? (
              <ul className="space-y-1">
                {assignedUsers.map((user, index) => (
                  <li key={index} className="text-sm">
                    <span className="text-gray-700">{user.name}</span>
                    <span className="text-gray-400 mx-1">({user.role})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin usuarios asignados</p>
            )}
          </div>

          {/* Monthly Summary */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Resumen del Mes
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Gastos:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(monthlySummary?.totalExpensesThisMonth || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pedidos Entregados:</span>
                <span className="font-medium text-gray-900">
                  {monthlySummary?.deliveredOrders || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usuarios Activos:</span>
                <span className="font-medium text-gray-900">
                  {monthlySummary?.activeUsers || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Última Actividad:</span>
                <span className="font-medium text-gray-900">
                  {monthlySummary?.lastActivity
                    ? formatDate(monthlySummary.lastActivity)
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Solo mostrar para usuarios con permisos (ADMIN, SUPER_ADMIN, SUPERVISOR) */}
      {canView && (
        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between gap-2">
          <div className="flex gap-3">
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {/* Link "Ver" visible para todos los que pueden view (ADMIN, SUPER_ADMIN, SUPERVISOR) */}
            <Link
              href={`/dashboard/admin/farmacias/${_id}`}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Ver
            </Link>
            {/* Link "Editar" solo para ADMIN y SUPER_ADMIN (no para SUPERVISOR) */}
            {canEdit && (
              <Link
                href={`/dashboard/admin/farmacias/${_id}/editar`}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Editar
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la farmacia <strong>{pharmacyName}</strong>? 
              La farmacia será marcada como inactiva.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}