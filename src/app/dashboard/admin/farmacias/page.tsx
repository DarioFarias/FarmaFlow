export default function FarmaciasPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmacias</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona el alta y baja de las 20 sucursales activas en el sistema.</p>
        </div>
        <button className="btn-primary">
          + Nueva Farmacia
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Código</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nombre</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              { code: 'FAR-001', name: 'Farmacia Centro', active: true },
              { code: 'FAR-002', name: 'Farmacia Norte', active: true },
              { code: 'FAR-003', name: 'Farmacia Sur', active: true },
            ].map((f) => (
              <tr key={f.code} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{f.code}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{f.name}</td>
                <td className="py-3 px-4 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Activa
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
