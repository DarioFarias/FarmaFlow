export default function SuministrosPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suministros</h1>
        <p className="text-gray-500 mt-1 text-sm">Gestiona los pedidos de insumos y sus estados (Pendiente, Despachado, Recibido).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
          <span className="text-xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en construcción</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Próximamente aquí verás el listado completo de pedidos con filtros por farmacia, estado y fecha pautada.
        </p>
      </div>
    </div>
  )
}
