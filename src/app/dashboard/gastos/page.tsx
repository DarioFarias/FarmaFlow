export default function GastosPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Auditoría de Gastos</h1>
        <p className="text-gray-500 mt-1 text-sm">Historial de gastos subidos por las sucursales con comprobantes adjuntos.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600 mb-4">
          <span className="text-xl">🧾</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo en construcción</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Próximamente aquí verás el listado de tickets subidos, listos para ser Aprobados o Disputados por el Supervisor.
        </p>
      </div>
    </div>
  )
}
