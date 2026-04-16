import Link from 'next/link'
import { Plus, MapPin, Phone, Mail } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'

export const dynamic = 'force-dynamic'

export default async function FarmaciasPage() {
  await connectDB()
  
  const farmacias = await Pharmacy.find({}).sort({ pharmacyName: 1 })

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
        {farmacias.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm italic bg-white rounded-xl border border-gray-100">
            No hay farmacias registradas todavía. ¡Haz clic en "Nueva Farmacia" para empezar!
          </div>
        ) : (
          farmacias.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {f.pharmacyCode}
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