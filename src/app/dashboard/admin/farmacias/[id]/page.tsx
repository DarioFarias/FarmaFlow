'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PharmacyView } from '@/components/admin/pharmacias/PharmacyView'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { IPharmacyMetrics } from '@/types/api-responses'
import { toast } from 'react-hot-toast'

// =============================================
// View Pharmacy Page
// Read-only page to view pharmacy details
// Route: /dashboard/admin/farmacias/[id]
// =============================================

export default function ViewPharmacyPage() {
  const params = useParams()
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<IPharmacyMetrics | null>(null)
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
        toast.error(err.message || 'Error al cargar los datos de la farmacia')
      } finally {
        setIsLoading(false)
      }
    }

    if (pharmacyId) {
      fetchPharmacy()
    }
  }, [pharmacyId])

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
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-800">Error</h2>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/admin/farmacias')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-800">Farmacia no encontrada</h2>
              <p className="text-sm text-yellow-600">La farmacia que buscas no existe o fue eliminada.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/admin/farmacias')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin/farmacias')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Volver al listado
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Detalles de Farmacia</h1>
      </div>

      <PharmacyView pharmacy={pharmacy} />
    </div>
  )
}