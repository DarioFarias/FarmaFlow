'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Save, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

interface PharmacyFormData {
  pharmacyName: string
  address: string
  phone: string
  email: string
}

const initialFormData: PharmacyFormData = {
  pharmacyName: '',
  address: '',
  phone: '',
  email: '',
}

export function CreatePharmacyForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PharmacyFormData>(initialFormData)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)
    
    try {
      const res = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear farmacia')
      
      toast.success('Farmacia creada correctamente')
      router.push('/dashboard/admin/farmacias')
      router.refresh()
    } catch (error: any) {
      setFormError(error.message || 'Error al crear farmacia')
      toast.error(error.message || 'Error al crear farmacia')
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
          <h2 className="text-lg font-semibold text-gray-900">Nueva Farmacia</h2>
          <p className="text-sm text-gray-500">Agrega una nueva sucursal al sistema.</p>
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
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder="+54 11 1234 5678"
              />
            </div>
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
            Crear Farmacia
          </button>
        </div>
      </form>
    </div>
  )
}