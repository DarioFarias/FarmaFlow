'use client'

import { Search, Plus, X } from 'lucide-react'

interface UsersToolbarProps {
  search: string
  isLoading: boolean
  onSearchChange: (value: string) => void
  onCreateClick: () => void
}

export default function UsersToolbar({
  search,
  isLoading,
  onSearchChange,
  onCreateClick,
}: UsersToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isLoading}
          className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none w-64 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Limpiar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Botón nuevo usuario */}
      <button
        onClick={onCreateClick}
        disabled={isLoading}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} />
        <span>Nuevo Usuario</span>
      </button>
    </div>
  )
}