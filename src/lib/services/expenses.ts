import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { UserRole } from '@/types'
import { PaginatedResponse, IExpenseResponse, IExpenseFilterParams } from '@/types/api-responses'
import { isAdmin } from '@/lib/roles'
import { TTLCache } from '@/lib/ttl-cache'

// =============================================
// TTL Cache for Pharmacy queries (module-level)
// =============================================
const pharmacyCache = new TTLCache<Array<{ _id: any }>>(60_000)

// =============================================
// Helper: Generates a cache key for pharmacy queries
// =============================================
function getPharmacyCacheKey(pharmacyIds: string[]): string {
  return [...pharmacyIds].sort().join(',')
}

// =============================================
// Helper: Build query filters from params
// =============================================
function buildExpenseFilter(filters: {
  status?: string
  period?: string
  startDate?: string
  endDate?: string
  pharmacyId?: string
}) {
  const query: any = {}

  // Status filter (supports CSV: 'PENDIENTE_DE_FACTURAR,FACTURADO')
  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim())
    query.status = { $in: statuses }
  }

  // Period filter
  if (filters.period) {
    query.period = filters.period
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.receiptDate = {}
    if (filters.startDate) {
      query.receiptDate.$gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      query.receiptDate.$lte = new Date(filters.endDate)
    }
  }

  // Pharmacy filter
  if (filters.pharmacyId) {
    query.pharmacy = filters.pharmacyId
  }

  return query
}

// =============================================
// Shared service: Get filtered expenses with pagination
// =============================================
/**
 * Retrieves filtered expenses with role-based pharmacy filtering
 * @param filters - Filter parameters (status, period, startDate, endDate, pharmacyId, sortBy, sortOrder)
 * @param userRole - Role of the requesting user
 * @param userId - ID of the requesting user
 * @param assignedPharmacies - Array of pharmacy IDs assigned to the user
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @returns Paginated response with expense data
 */
export async function getFilteredExpenses(
  filters: IExpenseFilterParams | undefined,
  userRole: UserRole,
  userId: string,
  assignedPharmacies: string[],
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<IExpenseResponse>> {
  await connectDB()

  let query: Record<string, unknown> = {}
  const userIsAdmin = isAdmin(userRole)

  // Role-based pharmacy filtering
  if (!userIsAdmin) {
    // Non-admin users (VENDEDOR, ENCARGADO, SUPERVISOR) - filter by assigned pharmacies
    if (assignedPharmacies.length === 0) {
      // No pharmacy assigned - return empty results
      query = { pharmacy: null }
    } else if (userRole === UserRole.SUPERVISOR) {
      // SUPERVISOR: Can filter by specific pharmacy if it's in their assignedPharmacies
      if (filters?.pharmacyId && assignedPharmacies.includes(filters.pharmacyId)) {
        // pharmacyId is valid - use it
        query.pharmacy = filters.pharmacyId
      } else {
        // Filter by all assigned pharmacies (ignore invalid pharmacyId)
        // Use cache for Pharmacy lookups
        const cacheKey = getPharmacyCacheKey(assignedPharmacies)
        let assignedPharmaciesDocs = pharmacyCache.get(cacheKey)

        if (!assignedPharmaciesDocs) {
          const { default: Pharmacy } = await import('@/models/Pharmacy')
          assignedPharmaciesDocs = await Pharmacy.find({
            _id: { $in: assignedPharmacies },
            isActive: true
          }).select('_id') as Array<{ _id: any }>
          pharmacyCache.set(cacheKey, assignedPharmaciesDocs)
        }

        const pharmacyIds = assignedPharmaciesDocs.map(p => p._id)
        query.pharmacy = { $in: pharmacyIds }
      }
    } else {
      // VENDEDOR/ENCARGADO: Force filter by their single pharmacy, IGNORE pharmacyId query param
      query.pharmacy = assignedPharmacies[0]
    }
  }
  // ADMIN/SUPER_ADMIN see all expenses - no pharmacy filter applied

  // Apply additional filters (EXCLUDE pharmacyId for non-admin - already handled above)
  const additionalFilters = filters ? buildExpenseFilter(filters) : {}
  // Remove pharmacyId from additionalFilters for non-admin to prevent override
  if (!userIsAdmin && additionalFilters.pharmacy) {
    delete additionalFilters.pharmacy
  }
  query = { ...query, ...additionalFilters }

  // Build sort options
  const sortOptions: Record<string, 1 | -1> = {}
  if (filters?.sortBy) {
    sortOptions[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1
  } else {
    sortOptions.createdAt = -1 // default
  }

  // Execute query with pagination
  const skip = (page - 1) * pageSize
  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .select('expenseNumber pharmacy pharmacyName amount currency category description vendor receiptDate status createdAt period pdfUrl xmlUrl'),
    Expense.countDocuments(query),
  ])

  const totalPages = Math.ceil(total / pageSize)

  // Build response matching the API contract
  const response: {
    data: IExpenseResponse[]
    total: number
    page: number
    limit: number
    pageSize: number
    totalPages: number
    filters?: {
      status?: string
      period?: string
      dateRange?: { startDate: string; endDate: string }
    }
  } = {
    data: expenses as unknown as IExpenseResponse[],
    total,
    page,
    limit: pageSize,
    pageSize,
    totalPages,
  }

  // Include filters applied for transparency
  if (filters && (filters.status || filters.period || filters.startDate || filters.endDate)) {
    response.filters = {
      status: filters.status,
      period: filters.period,
      dateRange: filters.startDate && filters.endDate
        ? { startDate: filters.startDate, endDate: filters.endDate }
        : undefined,
    }
  }

  return response
}

// Export for testing
export { buildExpenseFilter, getPharmacyCacheKey }