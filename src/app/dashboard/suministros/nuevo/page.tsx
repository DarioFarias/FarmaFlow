import { Metadata } from 'next'
import { SupplyRequestForm } from '../SupplyRequestForm'

export const metadata: Metadata = {
  title: 'Nuevo Pedido de Suministros',
  description: 'Levantar un nuevo requerimiento de insumos para la sucursal',
}

export default function NuevoSuministroPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nuevo Pedido</h1>
        <p className="text-gray-500 mt-2 text-base">
          Carga los insumos que tu farmacia necesita para operar.
        </p>
      </div>

      <SupplyRequestForm />
    </div>
  )
}
