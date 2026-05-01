'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Save, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { UserRole } from '@/types'
import { isAdmin } from '@/lib/roles'
import { validateMexicanPhone } from '@/lib/validations'

interface PharmacyFormData {
  pharmacyName: string
  address?: string
  phone?: string
  email?: string
  isActive?: boolean
}

interface PharmacyFormProps {
  initialData?: PharmacyFormData
  isEditMode?: boolean
  onSuccess?: () => void
}

const initialFormData: PharmacyFormData = {
  pharmacyName: '',
  address: undefined,
  phone: undefined,
  email: undefined,
  isActive: true,
}

export function PharmacyForm({ initialData, isEditMode = false, onSuccess }: PharmacyFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole | undefined
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PharmacyFormData>(initialData || initialFormData)
  const [formError, setFormError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Verificar permisos: solo ADMIN y SUPER_ADMIN pueden crear/editar farmacias
  const hasPermission = isAdmin(userRole)
  
  // Validación de teléfono en tiempo real
  const handlePhoneChange = useCallback((value: string) => {
    setFormData({ ...formData, phone: value })
    
    if (!value || value.trim() === '') {
      setPhoneError(null)
      return
    }
    
    const result = validateMexicanPhone(value)
    if (!result.valid) {
      setPhoneError(result.error || 'Teléfono inválido')
    } else {
      setPhoneError(null)
    }
  }, [formData])

  // Mostrar mensaje de acceso denegado si el usuario no tiene permisos
  if (!hasPermission) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-red-600">
            No tienes permisos para {isEditMode ? 'editar' : 'crear'} farmacias. Solo los usuarios con rol ADMIN o SUPER_ADMIN pueden realizar esta acción.
          </p>
          <Link
            href="/dashboard/admin/farmacias"
            className="inline-flex items-center mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <ArrowLeft size={16} className="mr-1" />
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    // Validar teléfono antes de enviar
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneResult = validateMexicanPhone(formData.phone)
      if (!phoneResult.valid) {
        setPhoneError(phoneResult.error || 'Teléfono inválido')
        setIsLoading(false)
        return
      }
    }

    const method = isEditMode ? 'PATCH' : 'POST'
    const url = isEditMode && initialData
      ? `/api/admin/pharmacies/${(initialData as any)._id || (initialData as any).id}`
      : '/api/admin/pharmacies'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} farmacia`)

      toast.success(isEditMode ? 'Farmacia actualizada correctamente' : 'Farmacia creada correctamente')

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/admin/farmacias')
        router.refresh()
      }
    } catch (error: any) {
      setFormError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} farmacia`)
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} farmacia`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/farmacias"
          className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Volver al listado
        </Link>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Editar Farmacia' : 'Nueva Farmacia'}
          </h2>
          <p className="text-sm text-gray-500">
            {isEditMode ? 'Modifica los datos de la sucursal.' : 'Agrega una nueva sucursal al sistema.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nombre de la Farmacia</label>
            <input
              type="text"
              required
              value={formData.pharmacyName}
              onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="Farmacia Centro"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder="Av. Corrientes 1234, Ciudad"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <div className="relative">
              <Phone size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${phoneError ? 'text-red-400' : 'text-gray-400'}`} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none ${
                  phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+52 55 1234 5678"
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                {phoneError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email de Contacto (opcional)</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder="centro@farmacia.com"
              />
            </div>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-600">
                  Farmacia activa
                </label>
              </div>
            </div>
          )}
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {formError}
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/dashboard/admin/farmacias"
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditMode ? 'Guardar Cambios' : 'Crear Farmacia'}
          </button>
        </div>
      </form>
    </div>
  )
}