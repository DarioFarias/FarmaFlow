'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { IPharmacyMetrics } from '@/types/api-responses'
import { PharmacyCard } from '@/components/admin/pharmacias/PharmacyCard'
import CreatePharmacyModal from '@/components/admin/farmacias/CreatePharmacyModal'
import EditPharmacyModal from '@/components/admin/farmacias/EditPharmacyModal'
import PharmacyDetailsModal from '@/components/admin/farmacias/PharmacyDetailsModal'
import { PharmaciesToolbar, StatusFilter, SortOption } from './PharmaciesToolbar'
import { PharmaciesPagination } from './PharmaciesPagination'

// =============================================
// Types
// =============================================

type FetchOverrides = {
  page?: number
  search?: string
}

interface FarmaciasListClientProps {
  initialData: IPharmacyMetrics[]
  initialPagination: {
    page: number
    totalPages: number
    total: number
  }
  userRole: string | undefined
}

// =============================================
// Constants
// =============================================

const PAGE_SIZE = 20

// =============================================
// Component: FarmaciasListClient
// =============================================

export function FarmaciasListClient({
  initialData,
  initialPagination,
  userRole,
}: FarmaciasListClientProps) {
  // State - initialized from props (no AJAX on initial render)
  const [farmacias, setFarmacias] = useState<IPharmacyMetrics[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')

  // Pagination state
  const [page, setPage] = useState(initialPagination.page)
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages)
  const [total, setTotal] = useState(initialPagination.total)

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<IPharmacyMetrics | null>(null)

  // Is supervisor
  const isSupervisor = userRole === 'SUPERVISOR'

  // Build query string for API calls — accepts overrides to avoid stale closure
  const buildQueryParams = useCallback(
    (overrides?: FetchOverrides) => {
      const params = new URLSearchParams()
      params.set('page', (overrides?.page ?? page).toString())
      params.set('pageSize', PAGE_SIZE.toString())

      if (overrides?.search ?? search) {
        params.set('search', overrides?.search ?? search)
      }
      if (statusFilter === 'active') params.set('isActive', 'true')
      else if (statusFilter === 'inactive') params.set('isActive', 'false')

      return params.toString()
    },
    [search, statusFilter, page]
  )

  // Fetch farmacias via AJAX — accepts overrides for fresh values (not stale closure)
  const fetchFarmacias = useCallback(
    async (overrides?: FetchOverrides) => {
      setIsLoading(true)

      try {
        const queryParams = buildQueryParams(overrides)
        const res = await fetch(`/api/admin/pharmacies/metrics?${queryParams}`, {
          cache: 'no-store',
        })
        const data = await res.json()

        if (data?.data && Array.isArray(data.data)) {
          setFarmacias(data.data as IPharmacyMetrics[])
        }

        // Update pagination from API response
        if (data.total !== undefined) {
          setTotal(data.total)
          setTotalPages(data.totalPages || Math.ceil(data.total / PAGE_SIZE))
        }
      } catch (error) {
        console.error('Error fetching farmacias:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [buildQueryParams]
  )

  // Handle search with 300ms debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setPage(1) // Reset to page 1 on search

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer — pasa el search value directamente (no desde estado, que estaría stale)
      debounceTimerRef.current = setTimeout(() => {
        setIsLoading(true)
        fetchFarmacias({ search: value })
      }, 300)
    },
    [fetchFarmacias]
  )

  // Handle status filter change — filtra 100% client-side, no necesita API call
  const handleStatusFilterChange = useCallback(
    (filter: StatusFilter) => {
      setStatusFilter(filter)
      setPage(1)
    },
    []
  )

  // Handle sort change — ordena 100% client-side, no necesita API call
  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortBy(newSort)
      setPage(1)
    },
    []
  )

  // Handle pagination — pasa newPage como override para evitar stale closure
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage)
        fetchFarmacias({ page: newPage })
      }
    },
    [totalPages, fetchFarmacias]
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Modal handlers
  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (pharmacy: IPharmacyMetrics) => {
    setSelectedPharmacy(pharmacy)
    setIsEditModalOpen(true)
  }

  const handleView = (pharmacy: IPharmacyMetrics) => {
    setSelectedPharmacy(pharmacy)
    setIsDetailsModalOpen(true)
  }

  const handleDeleteSuccess = () => {
    fetchFarmacias()
  }

  const handleModalSuccess = () => {
    fetchFarmacias()
  }

  // Apply client-side filtering and sorting
  const filteredFarmacias = Array.isArray(farmacias)
    ? farmacias
        .filter((f) => {
          // Search filter
          if (search && !f.pharmacyName.toLowerCase().includes(search.toLowerCase())) {
            return false
          }

          // Status filter
          if (statusFilter === 'active' && !f.isActive) return false
          if (statusFilter === 'inactive' && f.isActive) return false

          return true
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'name-asc':
              return a.pharmacyName.localeCompare(b.pharmacyName)
            case 'name-desc':
              return b.pharmacyName.localeCompare(a.pharmacyName)
            case 'pending-orders':
              return (b.pendingSupplyRequests || 0) - (a.pendingSupplyRequests || 0)
            case 'pending-expenses':
              return (b.pendingExpenses || 0) - (a.pendingExpenses || 0)
            case 'recent':
              return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
            default:
              return 0
          }
        })
    : []

  // Determine empty states
  const showNoAccessMessage = isSupervisor && filteredFarmacias.length === 0 && !search && statusFilter === 'all'
  const showEmpty =
    !showNoAccessMessage &&
    filteredFarmacias.length === 0 &&
    !isLoading

  // Loading state
  if (isLoading && farmacias.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmacias</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona las sucursales en el sistema ({filteredFarmacias.length}{' '}
            {statusFilter === 'all' ? 'registradas' : statusFilter === 'active' ? 'activas' : 'inactivas'}
            ).
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nueva Farmacia</span>
        </button>
      </div>

      {/* Toolbar */}
      <PharmaciesToolbar
        search={search}
        statusFilter={statusFilter}
        sortBy={sortBy}
        isLoading={isLoading}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onSortChange={handleSortChange}
      />

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showNoAccessMessage ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm italic bg-white rounded-xl border border-gray-100">
            No tienes farmacias asignadas. Contacta al administrador para que te asigne sucursales.
          </div>
        ) : showEmpty ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm italic bg-white rounded-xl border border-gray-100">
            {search || statusFilter !== 'all'
              ? 'No se encontraron farmacias'
              : 'No hay farmacias registradas todavía. ¡Haz clic en "Nueva Farmacia" para empezar!'}
          </div>
        ) : (
          filteredFarmacias.map((f) => (
            <PharmacyCard
              key={f._id}
              pharmacy={f}
              onView={handleView}
              onEdit={handleEdit}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <PharmaciesPagination
        page={page}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CreatePharmacyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <EditPharmacyModal
        isOpen={isEditModalOpen}
        pharmacy={selectedPharmacy}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPharmacy(null)
        }}
        onSuccess={handleModalSuccess}
      />
      <PharmacyDetailsModal
        isOpen={isDetailsModalOpen}
        pharmacy={selectedPharmacy}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedPharmacy(null)
        }}
        onEdit={(pharmacy) => {
          setIsDetailsModalOpen(false)
          handleEdit(pharmacy)
        }}
      />
    </div>
  )
}