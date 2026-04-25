'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Plus, MapPin, Phone, Mail, Edit, Loader2 } from 'lucide-react'
import { IPharmacyResponse } from '@/types/api-responses'

export default function FarmaciasPage() {
  const { data: session } = useSession()
  const [farmacias, setFarmacias] = useState<IPharmacyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const userRole = session?.user?.role
  const assignedPharmacies = session?.user?.assignedPharmacies as string[] | undefined
  const isSupervisor = userRole === 'SUPERVISOR'

  useEffect(() => {
    fetchFarmacias()
  }, [])

  const fetchFarmacias = async () => {
    try {
      const res = await fetch('/api/admin/pharmacies')
      const data = await res.json()
      
      let farms: IPharmacyResponse[] = []
      if (data && Array.isArray(data.data)) {
        farms = data.data as IPharmacyResponse[]
      } else if (Array.isArray(data)) {
        farms = data as IPharmacyResponse[]
      }

      // Si es SUPERVISOR, filtrar solo las farmacias asignadas
      if (isSupervisor && assignedPharmacies && assignedPharmacies.length > 0) {
        const assignedIds = assignedPharmacies.map(id => id.toString())
        farms = farms.filter(f => 
          assignedIds.includes(f._id.toString()) || 
          assignedIds.includes(String(f._id))
        )
      }

      setFarmacias(farms)
    } catch (error) {
      console.error('Error fetching farmacias:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const showNoAccessMessage = isSupervisor && (!assignedPharmacies || assignedPharmacies.length === 0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmacias</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona las sucursales activas en el sistema ({farmacias.length} registradas).
          </p>
        </div>
        <Link href="/dashboard/admin/farmacias/nueva" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nueva Farmacia</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showNoAccessMessage ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm italic bg-white rounded-xl border border-gray-100">
            No tienes farmacias asignadas. Contacta al administrador para que te asigne sucursales.
          </div>
        ) : farmacias.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm italic bg-white rounded-xl border border-gray-100">
            No hay farmacias registradas todavía. ¡Haz clic en "Nueva Farmacia" para empezar!
          </div>
        ) : (
          farmacias.map((f) => (
            <div key={f._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                    ID: {String(f._id).slice(-8)}
                  </span>
                </div>
                {f.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                    Inactiva
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{f.pharmacyName}</h3>
              
              <div className="space-y-2 text-sm text-gray-500">
                {f.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{f.address}</span>
                  </div>
                )}
                {f.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    <span>{f.phone}</span>
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>{f.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end gap-2">
                <Link 
                  href={`/dashboard/admin/farmacias/${f._id}`}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}