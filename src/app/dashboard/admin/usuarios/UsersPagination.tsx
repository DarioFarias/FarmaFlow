'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface UsersPaginationProps {
  page: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export default function UsersPagination({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: UsersPaginationProps) {
  // No renderizar si solo hay una página
  if (totalPages <= 1) {
    return null
  }

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1)
    }
  }

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <div className="text-sm text-gray-500">
        Página {page} de {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={page === 1 || isLoading}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={handleNext}
          disabled={page === totalPages || isLoading}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Siguiente página"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}