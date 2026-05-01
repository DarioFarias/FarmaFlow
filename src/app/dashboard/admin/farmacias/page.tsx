'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Plus, Search, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { IPharmacyMetrics } from '@/types/api-responses'
import { PharmacyCard } from '@/components/admin/pharmacias/PharmacyCard'

// =============================================
// FarmaciasPage - Admin Pharmacy Management
// With Search, Filter, Sort, Pagination, and Metrics
// =============================================

type StatusFilter = 'all' | 'active' | 'inactive'
type SortOption = 'name-asc' | 'name-desc' | 'pending-orders' | 'pending-expenses' | 'recent'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'pending-orders', label: 'Más pedidos pendientes' },
  { value: 'pending-expenses', label: 'Más gastos pendientes' },
  { value: 'recent', label: 'Más recientes' },
]

const PAGE_SIZE = 20

export default function FarmaciasPage() {
  const { data: session } = useSession()
  const [farmacias, setFarmacias] = useState<IPharmacyMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  const userRole = session?.user?.role
  const assignedPharmacies = session?.user?.assignedPharmacies as string[] | undefined
  const isSupervisor = userRole === 'SUPERVISOR'

  useEffect(() => {
    fetchFarmacias()
  }, [])

  // Handle search with 300ms debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1) // Reset to page 1 on search
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      setIsLoading(true)
      fetchFarmacias()
    }, 300)
    
    setDebounceTimer(timer)
  }, [debounceTimer])

  const fetchFarmacias = async () => {
    try {
      // Build query params - send to server-side API
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      
      // Handle search via API if present
      if (search) {
        params.set('search', search)
      }
      
      // Handle status filter
      if (statusFilter === 'active') {
        params.set('active', 'true')
      } else if (statusFilter === 'inactive') {
        params.set('active', 'false')
      }
      
      // Fetch with pagination params
      const [listRes, metricsRes] = await Promise.all([
        fetch(`/api/admin/pharmacies?${params.toString()}`),
        fetch('/api/admin/pharmacies/metrics'),
      ])
      
      const listData = await listRes.json()
      const metricsData = await metricsRes.json()
      
      let farms: IPharmacyMetrics[] = []
      
      // Use metrics data if available, otherwise fallback to list
      if (metricsData?.data && Array.isArray(metricsData.data)) {
        farms = metricsData.data as IPharmacyMetrics[]
      } else if (listData?.data && Array.isArray(listData.data)) {
        // Convert simple list to metrics format
        farms = (listData.data as any[]).map((f: any) => ({
          _id: f._id,
          pharmacyName: f.pharmacyName,
          address: f.address,
          phone: f.phone,
          email: f.email,
          isActive: f.isActive,
          pendingSupplyRequests: 0,
          pendingExpenses: 0,
          assignedUsers: [],
          monthlySummary: {
            totalExpensesThisMonth: 0,
            deliveredOrders: 0,
            activeUsers: 0,
            lastActivity: f.updatedAt,
          },
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }))
      } else if (Array.isArray(listData)) {
        farms = (listData as any[]).map((f: any) => ({
          _id: f._id,
          pharmacyName: f.pharmacyName,
          address: f.address,
          phone: f.phone,
          email: f.email,
          isActive: f.isActive,
          pendingSupplyRequests: 0,
          pendingExpenses: 0,
          assignedUsers: [],
          monthlySummary: {
            totalExpensesThisMonth: 0,
            deliveredOrders: 0,
            activeUsers: 0,
            lastActivity: f.updatedAt,
          },
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }))
      }

      // Apply client-side filtering for SUPERVISOR (still needed for metrics endpoint)
      if (isSupervisor && assignedPharmacies && assignedPharmacies.length > 0) {
        const assignedIds = assignedPharmacies.map(id => id.toString())
        farms = farms.filter(f => 
          assignedIds.includes(f._id.toString()) || 
          assignedIds.includes(String(f._id))
        )
      }

      // Update pagination state from API response
      if (listData?.totalPages) {
        setTotalPages(listData.totalPages)
      }
      if (listData?.total !== undefined) {
        setTotal(listData.total)
      }
      
      setFarmacias(farms)
    } catch (error) {
      console.error('Error fetching farmacias:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter/status changes - reset to page 1
  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter)
    setPage(1)
    setIsLoading(true)
    fetchFarmacias()
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPage(1)
    setIsLoading(true)
    fetchFarmacias()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      setIsLoading(true)
      fetchFarmacias()
    }
  }

  // Apply filters and sort
  const filteredFarmacias = Array.isArray(farmacias) ? farmacias.filter(f => {
    // Search filter
    if (search && !f.pharmacyName.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (statusFilter === 'active' && !f.isActive) return false
    if (statusFilter === 'inactive' && f.isActive) return false
    
    return true
  }).sort((a, b) => {
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
  }) : []

  const showNoAccessMessage = isSupervisor && (!assignedPharmacies || assignedPharmacies.length === 0)
  const showEmpty = !showNoAccessMessage && filteredFarmacias.length === 0

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
            Gestiona las sucursales en el sistema ({filteredFarmacias.length} {statusFilter === 'all' ? 'registradas' : statusFilter === 'active' ? 'activas' : 'inactivas'}).
          </p>
        </div>
        <Link href="/dashboard/admin/farmacias/nueva" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nueva Farmacia</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar farmacias..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setIsLoading(true)
                fetchFarmacias()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === filter
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter === 'all' ? 'Todas' : filter === 'active' ? 'Activas' : 'Inactivas'}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="ml-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

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
            <PharmacyCard key={f._id} pharmacy={f} />
          ))
        )}
      </div>
    </div>
  )
}