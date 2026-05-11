import { useQuery } from '@tanstack/react-query'
import { IExpenseResponse } from '@/types/api-responses'

interface ExpenseFilters {
  pharmacyId?: string
  status?: string
  category?: string
  startDate?: string
  endDate?: string
}

interface UseExpensesOptions {
  filters?: ExpenseFilters
  page?: number
  pageSize?: number
}

interface UseExpensesResult {
  expenses: IExpenseResponse[]
  total: number
  totalPages: number
  page: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

async function fetchExpenses(
  filters: ExpenseFilters,
  page: number,
  pageSize: number
): Promise<{ data: IExpenseResponse[], total: number, page: number, totalPages: number, limit: number }> {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('pageSize', pageSize.toString())

  if (filters?.pharmacyId) params.set('pharmacyId', filters.pharmacyId)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)

  const response = await fetch(`/api/expenses?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los gastos')
  }
  
  return response.json()
}

/**
 * Hook for fetching expenses with React Query caching.
 * Uses staleTime of 30 seconds as per REQ-PERF-003.
 */
export function useExpenses(options: UseExpensesOptions = {}): UseExpensesResult {
  const { filters = {}, page = 1, pageSize = 20 } = options

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', filters, page, pageSize],
    queryFn: () => fetchExpenses(filters, page, pageSize),
    staleTime: 30 * 1000, // 30 seconds (REQ-PERF-003)
    retry: 2,
  })

  return {
    expenses: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    page: data?.page || page,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}