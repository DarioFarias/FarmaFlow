'use client'

import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { ExpenseStatus } from '@/types'

// =============================================
// Types
// =============================================

export interface PharmacyOption {
  pharmacyId: string
  pharmacyName: string
}

export interface ExpenseFilters {
  status: string
  pharmacyId: string
  fromDate: string
  toDate: string
}

interface GastosFiltersProps {
  filters: ExpenseFilters
  pharmacies: PharmacyOption[]
  isUserAdmin: boolean
  showFilters: boolean
  onFilterChange: (key: keyof ExpenseFilters, value: string) => void
  onApply: () => void
  onClear: () => void
  onToggleFilters: () => void
}

// =============================================
// Component: Filter Controls
// =============================================
export function GastosFilters({
  filters,
  pharmacies,
  isUserAdmin,
  showFilters,
  onFilterChange,
  onApply,
  onClear,
  onToggleFilters,
}: GastosFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      {/* Mobile filters toggle button */}
      <button
        onClick={onToggleFilters}
        className="md:hidden flex items-center gap-2 w-full mb-3 text-left text-sm font-medium text-gray-700"
      >
        {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        Filtros
      </button>

      <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap gap-4 items-end`}>
        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-xs font-medium text-gray-600">
            Estado
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los estados</option>
            <option value={ExpenseStatus.PENDIENTE_DE_FACTURAR}>Pendiente de Facturar</option>
            <option value={ExpenseStatus.FACTURADO}>Facturado</option>
            <option value={ExpenseStatus.REPORTED}>Reportado</option>
            <option value={ExpenseStatus.PENDIENTE_DE_PAGO}>Pendiente de Pago</option>
            <option value={ExpenseStatus.PAID}>Pagado</option>
          </select>
        </div>

        {/* Pharmacy Filter (Admin only) */}
        {isUserAdmin && (
          <div className="flex flex-col gap-1">
            <label htmlFor="pharmacy-filter" className="text-xs font-medium text-gray-600">
              Farmacia
            </label>
            <select
              id="pharmacy-filter"
              value={filters.pharmacyId}
              onChange={(e) => onFilterChange('pharmacyId', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[200px]"
            >
              <option value="">Todas las farmacias</option>
              {pharmacies.map((p) => (
                <option key={p.pharmacyId} value={p.pharmacyId}>
                  {p.pharmacyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* From Date Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="from-date-filter" className="text-xs font-medium text-gray-600">
            Desde
          </label>
          <input
            id="from-date-filter"
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* To Date Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="to-date-filter" className="text-xs font-medium text-gray-600">
            Hasta
          </label>
          <input
            id="to-date-filter"
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Apply and Clear Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onApply}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Aplicar
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}