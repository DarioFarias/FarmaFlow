'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PharmacyForm } from '@/components/admin/pharmacias/PharmacyForm'
import { Loader2 } from 'lucide-react'

interface PharmacyData {
  _id: string
  pharmacyName: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
}

export default function EditPharmacyPage() {
  const params = useParams()
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pharmacyId = params.id as string

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        const res = await fetch(`/api/admin/pharmacies/${pharmacyId}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Error al cargar la farmacia')
        }

        setPharmacy(data)
      } catch (err: any) {
        setError(err.message || 'Error al cargar la farmacia')
      } finally {
        setIsLoading(false)
      }
    }

    if (pharmacyId) {
      fetchPharmacy()
    }
  }, [pharmacyId])

  const handleSuccess = () => {
    router.push('/dashboard/admin/farmacias')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-sm text-gray-500">Cargando datos de la farmacia...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => router.push('/dashboard/admin/farmacias')}
            className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="max-w-2xl">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Farmacia no encontrada</p>
          <p className="text-sm">La farmacia que buscas no existe o fue eliminada.</p>
          <button
            onClick={() => router.push('/dashboard/admin/farmacias')}
            className="mt-3 text-sm text-yellow-600 hover:text-yellow-700 underline"
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PharmacyForm
        initialData={pharmacy}
        isEditMode={true}
        onSuccess={handleSuccess}
      />
    </div>
  )
}