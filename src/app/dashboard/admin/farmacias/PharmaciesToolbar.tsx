'use client'

import { Search, X } from 'lucide-react'

// =============================================
// Types
// =============================================

export type StatusFilter = 'all' | 'active' | 'inactive'
export type SortOption = 'name-asc' | 'name-desc' | 'pending-orders' | 'pending-expenses' | 'recent'

export interface PharmaciesToolbarProps {
  search: string
  statusFilter: StatusFilter
  sortBy: SortOption
  isLoading: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (filter: StatusFilter) => void
  onSortChange: (sort: SortOption) => void
}

// =============================================
// Constants
// =============================================

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'pending-orders', label: 'Más pedidos pendientes' },
  { value: 'pending-expenses', label: 'Más gastos pendientes' },
  { value: 'recent', label: 'Más recientes' },
]

// =============================================
// Component: PharmaciesToolbar
// =============================================

export function PharmaciesToolbar({
  search,
  statusFilter,
  sortBy,
  isLoading,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
}: PharmaciesToolbarProps) {
  return (
    <>
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar farmacias..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs and Sort */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onStatusFilterChange(filter)}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === filter
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {filter === 'all' ? 'Todas' : filter === 'active' ? 'Activas' : 'Inactivas'}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          disabled={isLoading}
          className={`ml-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}