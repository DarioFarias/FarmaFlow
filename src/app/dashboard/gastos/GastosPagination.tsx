'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

// =============================================
// Types
// =============================================

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface GastosPaginationProps {
  pagination: PaginationInfo
  onPageChange: (newPage: number) => void
}

// =============================================
// Component: Pagination Controls
// =============================================
export function GastosPagination({ pagination, onPageChange }: GastosPaginationProps) {
  const { page, pageSize, total, totalPages } = pagination

  // Don't render if no data
  if (total === 0) {
    return null
  }

  // Calculate showing range
  const showingStart = (page - 1) * pageSize + 1
  const showingEnd = Math.min(page * pageSize, total)

  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1)
    }
  }

  return (
    <>
      {/* Desktop pagination */}
      <div className="hidden md:block border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/30">
        {/* Showing X-Y of Z */}
        <div className="text-sm text-gray-500">
          Mostrando {showingStart}-{showingEnd} de {total} resultados
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Mobile pagination */}
      <div className="block md:hidden bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="text-sm text-gray-500 text-center mb-3">
          Mostrando {showingStart}-{showingEnd} de {total}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  )
}