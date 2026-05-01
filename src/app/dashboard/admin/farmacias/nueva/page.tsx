import { Metadata } from 'next'
import { PharmacyForm } from '@/components/admin/pharmacias/PharmacyForm'

export const metadata: Metadata = {
  title: 'Nueva Farmacia',
  description: 'Dar de alta una nueva sucursal en el sistema',
}

export default function NuevaFarmaciaPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nueva Farmacia</h1>
        <p className="text-gray-500 mt-2 text-base">
          Registra una nueva sucursal para que pueda empezar a gestionar sus pedidos y gastos.
        </p>
      </div>

      <PharmacyForm isEditMode={false} />
    </div>
  )
}
