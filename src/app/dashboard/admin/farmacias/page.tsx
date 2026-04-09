import Link from 'next/link'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { UserRole } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FarmaciasPage() {
  await connectDB()
  
  const farmacias = await User.find({ 
    role: UserRole.PHARMACY 
  }).sort({ pharmacyName: 1 })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmacias</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona el alta y baja de las sucursales activas en el sistema ({farmacias.length} registradas).
          </p>
        </div>
        <Link href="/dashboard/admin/farmacias/nueva" className="btn-primary flex items-center gap-2">
          <span>+ Nueva Farmacia</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Código</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nombre de Sucursal</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Responsable</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
            </tr>
          </thead>
          <tbody>
            {farmacias.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400 text-sm italic">
                  No hay farmacias registradas todavía. ¡Haz clic en "+ Nueva Farmacia" para empezar!
                </td>
              </tr>
            ) : (
              farmacias.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/10 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono font-bold text-brand-600">
                    {f.pharmacyCode || '---'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    {f.pharmacyName}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">{f.name}</span>
                      <span className="text-xs text-gray-500">{f.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {f.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                        Inactiva
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
