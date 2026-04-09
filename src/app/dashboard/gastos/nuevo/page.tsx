import { Metadata } from 'next'
import { ExpenseForm } from '../ExpenseForm'

export const metadata: Metadata = {
  title: 'Rendir Gasto',
  description: 'Cargar un nuevo gasto de la sucursal con comprobante',
}

export default function NuevoGastoPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rendir Gasto</h1>
        <p className="text-gray-500 mt-2 text-base">
          Cargá los datos del gasto y subí una foto clara del comprobante para su auditoría.
        </p>
      </div>

      <ExpenseForm />
    </div>
  )
}
