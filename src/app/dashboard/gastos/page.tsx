'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Receipt, Plus, Loader2, ChevronLeft, ChevronRight, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserRole, ExpenseStatus } from '@/types'
import { IExpenseResponse } from '@/types/api-responses'
import { AuditActions } from '@/components/audit/AuditActions'
import { BatchActionToolbar } from '@/components/gastos/BatchActionToolbar'

// =============================================
// STATUS_CONFIG - Phase 3: Updated status labels and colors
// =============================================
const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [ExpenseStatus.PENDIENTE_DE_FACTURAR]: {
    label: 'Pendiente de Facturar',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/20'
  },
  [ExpenseStatus.FACTURADO]: {
    label: 'Facturado',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20'
  },
  [ExpenseStatus.REPORTED]: {
    label: 'Reportado',
    classes: 'bg-purple-50 text-purple-700 ring-purple-600/20'
  },
  [ExpenseStatus.PENDIENTE_DE_PAGO]: {
    label: 'Pendiente de Pago',
    classes: 'bg-orange-50 text-orange-700 ring-orange-600/20'
  },
  [ExpenseStatus.PAID]: {
    label: 'Pagado',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  },
}

// =============================================
// Filter state type
// =============================================
interface ExpenseFilters {
  status: string
  pharmacyId: string
  fromDate: string
  toDate: string
}

// =============================================
// Pagination info type
// =============================================
interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// =============================================
// Pharmacy type for dropdown
// =============================================
interface PharmacyOption {
  pharmacyId: string
  pharmacyName: string
}

// Helper para verificar si es admin
function isAdminUser(role?: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR
}

export default function GastosPage() {
  const { data: session } = useSession()
  const [gastos, setGastos] = useState<IExpenseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([])

  // Filter state
  const [filters, setFilters] = useState<ExpenseFilters>({
    status: '',
    pharmacyId: '',
    fromDate: '',
    toDate: '',
  })

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filters visibility state (mobile only)
  const [showFilters, setShowFilters] = useState(true)

  // Ref to track if initial fetch is done - prevents duplicate fetches
  const initialFetchDone = useRef(false)

  const userRole = session?.user?.role as UserRole | undefined
  const isUserAdmin = isAdminUser(userRole)

  // Build query string from filters and pagination - ONLY recalculate on actual filter/page changes
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    params.set('page', pagination.page.toString())
    params.set('pageSize', pagination.pageSize.toString())

    if (filters.status) params.set('status', filters.status)
    if (filters.pharmacyId) params.set('pharmacyId', filters.pharmacyId)
    if (filters.fromDate) params.set('startDate', filters.fromDate)
    if (filters.toDate) params.set('endDate', filters.toDate)

    return params.toString()
  }, [filters.status, filters.pharmacyId, filters.fromDate, filters.toDate, pagination.page, pagination.pageSize])

  // Fetch expenses with filters and pagination
  const fetchGastos = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    try {
      const queryParams = buildQueryParams()
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
    if (!isUserAdmin || pharmacies.length > 0) return // Already fetched
    
    try {
      const res = await fetch('/api/my-pharmacies')
      const data = await res.json()

      if (data.data && Array.isArray(data.data)) {
        setPharmacies(data.data as PharmacyOption[])
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
    }
  }, [isUserAdmin, pharmacies.length])

  // Initial data fetch - ONLY on mount
  // Pagination and filter changes are handled by the button handlers directly
  useEffect(() => {
    if (initialFetchDone.current) return
    initialFetchDone.current = true
    
    fetchGastos(true)
    fetchPharmacies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler for filter changes
  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Reset to page 1 when filter changes
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Apply filters - refetch
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchGastos(true)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({ status: '', pharmacyId: '', fromDate: '', toDate: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchGastos(true)
  }

  // Pagination handlers - directly fetch new page
  const goToPreviousPage = () => {
    if (pagination.page > 1) {
      const newPage = pagination.page - 1
      setPagination(prev => ({ ...prev, page: newPage }))
      fetchGastos(true)
    }
  }

  const goToNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      const newPage = pagination.page + 1
      setPagination(prev => ({ ...prev, page: newPage }))
      fetchGastos(true)
    }
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

  // Calculate showing range for pagination display
  const showingStart = (pagination.page - 1) * pagination.pageSize + 1
  const showingEnd = Math.min(pagination.page * pagination.pageSize, pagination.total)

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        {/* Mobile filters toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
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
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
                onChange={(e) => handleFilterChange('pharmacyId', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[200px]"
              >
                <option value="">Todas las farmacias</option>
                {pharmacies.map(p => (
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
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
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
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Apply and Clear Buttons */}
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Batch Selection Toolbar - Show when items selected */}
      <BatchActionToolbar
        selectedIds={selectedIds}
        currentFilter={filters.status}
        onClear={clearSelection}
      />

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {/* Batch Select All Checkbox */}
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === gastos.length && gastos.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nº Gasto</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Fecha</th>
              {isUserAdmin && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
              )}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Descripción</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Monto</th>
              {/* Removed "Categoría" column as per spec */}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Acciones</th>
              {isUserAdmin && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Auditoría</th>
              )}
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={isUserAdmin ? 8 : 6} className="py-12 text-center">
                  <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm italic">No hay gastos registrados todavía.</p>
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
                const isSelected = selectedIds.includes(g._id)
                return (
                  <tr key={g._id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors ${isSelected ? 'bg-brand-50/30' : ''}`}>
                    {/* Batch Select Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(g._id)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">
                      {g.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {g.receiptDate
                        ? format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es })
                        : '-'}
                    </td>
                    {isUserAdmin && (
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {g.pharmacyName}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-900 max-w-[200px] truncate">
                      {g.description}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {g.currency} {g.amount.toLocaleString('es-MX')}
                    </td>
                    {/* Status directly - removed Category column */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    {/* Edit button - only for PENDIENTE_DE_FACTURAR */}
                    <td className="py-3 px-4">
                      {g.status === ExpenseStatus.PENDIENTE_DE_FACTURAR ? (
                        <Link
                          href={`/dashboard/gastos/${g._id}/editar`}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Editar
                        </Link>
                      ) : null}
                    </td>
                    {isUserAdmin && (
                      <td className="py-3 px-4">
                        <AuditActions id={g._id} type="expense" currentStatus={g.status} />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {pagination.total > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/30">
            {/* Showing X-Y of Z */}
            <div className="text-sm text-gray-500">
              Mostrando {showingStart}-{showingEnd} de {pagination.total} resultados
            </div>

            {/* Page Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>

              <button
                onClick={goToPreviousPage}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={goToNextPage}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="block md:hidden space-y-3">
        {gastos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm italic">No hay gastos registrados todavía.</p>
          </div>
        ) : (
          gastos.map((g) => {
            const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
            const isSelected = selectedIds.includes(g._id)
            return (
              <div
                key={g._id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 ${isSelected ? 'bg-brand-50/30 border-brand-200' : ''}`}
              >
                {/* Header with checkbox and expense number */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(g._id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    data-testid={`expense-checkbox-${g._id}`}
                  />
                  <span className="font-bold text-gray-900">{g.expenseNumber}</span>
                  <span className={`ml-auto inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Fecha</span>
                    <p className="text-gray-900">
                      {g.receiptDate
                        ? format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es })
                        : '-'}
                    </p>
                  </div>
                  {isUserAdmin && (
                    <div>
                      <span className="text-gray-500 text-xs">Sucursal</span>
                      <p className="text-gray-900">{g.pharmacyName}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs">Descripción</span>
                    <p className="text-gray-900 truncate">{g.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Monto</span>
                    <p className="font-medium text-gray-900">
                      {g.currency} {g.amount.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {g.status === ExpenseStatus.PENDIENTE_DE_FACTURAR && (
                    <Link
                      href={`/dashboard/gastos/${g._id}/editar`}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Editar
                    </Link>
                  )}
                  {isUserAdmin && (
                    <div className="ml-auto">
                      <AuditActions id={g._id} type="expense" currentStatus={g.status} />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Pagination - Mobile */}
        {pagination.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500 text-center mb-3">
              Mostrando {showingStart}-{showingEnd} de {pagination.total}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected count indicator when items selected */}
      {selectedIds.length > 0 && (
        <div className="fixed top-20 right-4 bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40">
          {selectedIds.length} gasto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
