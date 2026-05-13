'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { UserRole } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'
import { BatchActionToolbar } from '@/components/gastos/BatchActionToolbar'
import { GastosFilters, PharmacyOption, ExpenseFilters } from './GastosFilters'
import { ExpenseTable } from './ExpenseTable'
import { ExpenseCards } from './ExpenseCards'
import { GastosPagination, PaginationInfo } from './GastosPagination'

// =============================================
// Types
// =============================================

interface GastosListClientProps {
  initialGastos: IExpenseResponse[]
  initialPagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  userRole: UserRole | undefined
  pharmacies: PharmacyOption[]
}

// =============================================
// Initial filter state
// =============================================
const initialFilters: ExpenseFilters = {
  status: '',
  pharmacyId: '',
  fromDate: '',
  toDate: '',
}

// =============================================
// Component: Client-side Gastos List
// =============================================
export function GastosListClient({
  initialGastos,
  initialPagination,
  userRole,
  pharmacies,
}: GastosListClientProps) {
  // State - initialized from props (no AJAX on initial render)
  const [gastos, setGastos] = useState<IExpenseResponse[]>(initialGastos)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPharmacies, setCurrentPharmacies] = useState<PharmacyOption[]>(pharmacies)

  // Filter state
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters)

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPagination.page,
    pageSize: initialPagination.pageSize,
    total: initialPagination.total,
    totalPages: initialPagination.totalPages,
  })

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filters visibility state (mobile only)
  const [showFilters, setShowFilters] = useState(true)

  const isUserAdmin = userRole === UserRole.ADMIN || 
                      userRole === UserRole.SUPER_ADMIN || 
                      userRole === UserRole.SUPERVISOR

  // Build query string from filters and pagination
  const buildQueryParams = useCallback((pageOverride?: number) => {
    const params = new URLSearchParams()
    params.set('page', (pageOverride ?? pagination.page).toString())
    params.set('pageSize', pagination.pageSize.toString())

    if (filters.status) params.set('status', filters.status)
    if (filters.pharmacyId) params.set('pharmacyId', filters.pharmacyId)
    if (filters.fromDate) params.set('startDate', filters.fromDate)
    if (filters.toDate) params.set('endDate', filters.toDate)

    return params.toString()
  }, [filters.status, filters.pharmacyId, filters.fromDate, filters.toDate, pagination.page, pagination.pageSize])

  // Fetch expenses with filters and pagination (AJAX for non-initial fetches)
  const fetchGastos = useCallback(async (showLoading = true, pageOverride?: number) => {
    if (showLoading) setIsLoading(true)
    try {
      const queryParams = buildQueryParams(pageOverride)
      const res = await fetch(`/api/expenses?${queryParams}`)
      const data = await res.json()

      let items: IExpenseResponse[] = []
      if (data && Array.isArray(data.data)) {
        items = data.data as IExpenseResponse[]
      } else if (Array.isArray(data)) {
        items = data as IExpenseResponse[]
      }

      setGastos(items)

      // Update pagination info from API response
      if (data.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages || Math.ceil(data.total / prev.pageSize),
        }))
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [buildQueryParams])

  // Fetch pharmacies for admin filter - ONLY fetch once
  const fetchPharmacies = useCallback(async () => {
    if (!isUserAdmin || currentPharmacies.length > 0) return

    try {
      const res = await fetch('/api/my-pharmacies')
      const data = await res.json()

      if (data.data && Array.isArray(data.data)) {
        setCurrentPharmacies(data.data as PharmacyOption[])
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
    }
  }, [isUserAdmin, currentPharmacies.length])

  // Fetch pharmacies on mount (for admin users)
  useEffect(() => {
    fetchPharmacies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler for filter changes
  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Reset to page 1 when filter changes
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Apply filters - refetch with page 1
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchGastos(true, 1)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters(initialFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchGastos(true, 1)
  }

  // Pagination handlers - directly fetch new page
  const goToPage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    // Pass newPage as override since state update isn't applied yet
    fetchGastos(true, newPage)
  }

  // Batch selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === gastos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(gastos.map(g => g._id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const clearSelection = () => {
    setSelectedIds([])
    // Refresh data after batch action (no loading spinner for this refresh)
    fetchGastos(false)
  }

  const toggleFilters = () => {
    setShowFilters(prev => !prev)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gastos</h1>
          <p className="text-gray-500 mt-1 text-sm">Registra y gestiona los gastos operativos.</p>
        </div>
        <Link href="/dashboard/gastos/nuevo" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuevo Gasto
        </Link>
      </div>

      {/* Filters Section */}
      <GastosFilters
        filters={filters}
        pharmacies={currentPharmacies}
        isUserAdmin={isUserAdmin}
        showFilters={showFilters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
        onToggleFilters={toggleFilters}
      />

      {/* Batch Selection Toolbar */}
      <BatchActionToolbar
        selectedIds={selectedIds}
        currentFilter={filters.status}
        onClear={clearSelection}
      />

      {/* Table - Desktop */}
      <ExpenseTable
        gastos={gastos}
        selectedIds={selectedIds}
        isUserAdmin={isUserAdmin}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectOne={toggleSelectOne}
      />

      {/* Cards - Mobile */}
      <ExpenseCards
        gastos={gastos}
        selectedIds={selectedIds}
        isUserAdmin={isUserAdmin}
        onToggleSelectOne={toggleSelectOne}
      />

      {/* Pagination */}
      <GastosPagination
        pagination={pagination}
        onPageChange={goToPage}
      />

      {/* Selected count indicator when items selected */}
      {selectedIds.length > 0 && (
        <div className="fixed top-20 right-4 bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40">
          {selectedIds.length} gasto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}