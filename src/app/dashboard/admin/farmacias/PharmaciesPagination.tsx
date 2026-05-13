'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

// =============================================
// Types
// =============================================

export interface PharmaciesPaginationProps {
  page: number
  totalPages: number
  total: number
  isLoading: boolean
  onPageChange: (newPage: number) => void
}

// =============================================
// Component: PharmaciesPagination
// =============================================

export function PharmaciesPagination({
  page,
  totalPages,
  total,
  isLoading,
  onPageChange,
}: PharmaciesPaginationProps) {
  // Don't render if no pagination needed
  if (totalPages <= 1 || total === 0) {
    return null
  }

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
    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
      <div className="text-sm text-gray-500">
        Página <span className="font-medium text-gray-900">{page}</span> de{' '}
        <span className="font-medium text-gray-900">{totalPages}</span>
        {total > 0 && <span className="ml-2">({total} resultados)</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={page === 1 || isLoading}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            page === 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages || isLoading}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            page === totalPages
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}