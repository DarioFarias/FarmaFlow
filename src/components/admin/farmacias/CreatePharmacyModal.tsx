'use client'

import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateMexicanPhone } from '@/lib/validations'
import type { PharmacyFormData, CreatePharmacyModalProps } from './types'

const initialFormData: PharmacyFormData = {
  pharmacyName: '',
  address: '',
  phone: '',
  email: '',
  schedule: '',
}

export default function CreatePharmacyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePharmacyModalProps) {
  const [formData, setFormData] = useState<PharmacyFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData(initialFormData)
    setFormError(null)
    setPhoneError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const res = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear farmacia')

      toast.success('Farmacia creada correctamente')
      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear farmacia'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Crear Nueva Farmacia</h2>
          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
<div>
            <label htmlFor="pharmacyName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id="pharmacyName"
              type="text"
              required
              value={formData.pharmacyName}
              onChange={(e) =>
                setFormData({ ...formData, pharmacyName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="Nombre de la farmacia"
            />
          </div>

          <div>
            <label htmlFor="pharmacyAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              id="pharmacyAddress"
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label htmlFor="pharmacyPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              id="pharmacyPhone"
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
              placeholder="+52 55 1234 5678"
            />
          </div>

          <div>
            <label htmlFor="pharmacyEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="pharmacyEmail"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="pharmacySchedule" className="block text-sm font-medium text-gray-700 mb-1">
              Horario
            </label>
            <input
              id="pharmacySchedule"
              type="text"
              value={formData.schedule}
              onChange={(e) =>
                setFormData({ ...formData, schedule: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="Ej: 8:00 a 20:00 hrs"
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
              onClick={() => {
                resetForm()
                onClose()
              }}
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
                'Crear Farmacia'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}