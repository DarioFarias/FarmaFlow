'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateMexicanPhone } from '@/lib/validations'
import type { PharmacyFormData, EditPharmacyModalProps } from './types'
import type { IPharmacyMetrics } from '@/types/api-responses'

export default function EditPharmacyModal({
  isOpen,
  pharmacy,
  onClose,
  onSuccess,
}: EditPharmacyModalProps) {
  const [formData, setFormData] = useState<PharmacyFormData>({
    pharmacyName: '',
    address: '',
    phone: '',
    email: '',
    schedule: '',
  })
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Cargar datos de la farmacia cuando se abre el modal
  useEffect(() => {
    if (pharmacy && isOpen) {
      setFormData({
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address || '',
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        schedule: '', // Este campo no existe en IPharmacyMetrics
      })
      setIsActive(pharmacy.isActive)
      setFormError(null)
      setPhoneError(null)
    }
  }, [pharmacy, isOpen])

  const handleToggleActive = async () => {
    if (!pharmacy) return

    setIsToggling(true)
    try {
      const newActiveState = !isActive
      const res = await fetch(`/api/admin/pharmacies/${pharmacy._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado')

      setIsActive(newActiveState)
      toast.success(
        newActiveState ? 'Farmacia reactivada' : 'Farmacia desactivada'
      )
      onSuccess()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cambiar estado'
      toast.error(message)
    } finally {
      setIsToggling(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pharmacy) return

    setIsSubmitting(true)
    setFormError(null)

    // Validar teléfono antes de enviar
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneResult = validateMexicanPhone(formData.phone)
      if (!phoneResult.valid) {
        setPhoneError(phoneResult.error || 'Teléfono inválido')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacy._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar farmacia')

      toast.success('Farmacia actualizada correctamente')
      onSuccess()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar farmacia'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !pharmacy) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Editar Farmacia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Estado toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <p className="text-xs text-gray-500">
                {isActive ? 'Farmacia activa' : 'Farmacia inactiva'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={handleToggleActive}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-gray-300'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label
              htmlFor="editPharmacyName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre *
            </label>
            <input
              id="editPharmacyName"
              type="text"
              required
              value={formData.pharmacyName}
              onChange={(e) =>
                setFormData({ ...formData, pharmacyName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="editPharmacyAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dirección
            </label>
            <input
              id="editPharmacyAddress"
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="editPharmacyPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono
            </label>
            <input
              id="editPharmacyPhone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value
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
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none ${
                phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                {phoneError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="editPharmacyEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="editPharmacyEmail"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}