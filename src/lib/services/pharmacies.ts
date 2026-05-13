import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import SupplyRequest from '@/models/SupplyRequest'
import Expense from '@/models/Expense'
import User from '@/models/User'
import { metricsCache, getMetricsCacheKey } from '@/lib/metrics-cache'
import { IPharmacyMetrics, IAssignedUser, IMonthlySummary } from '@/types/api-responses'
import { UserRole, SupplyRequestStatus } from '@/types'

// =============================================
// Types
// =============================================

export interface PharmacyFilterParams {
  search?: string
  active?: boolean
  sortBy?: string
}

export interface PharmacyMetricsResult {
  data: IPharmacyMetrics[]
  page: number
  totalPages: number
  total: number
}

// =============================================
// Helper: Build pharmacy query filters
// =============================================

function buildPharmacyFilter(params: {
  search?: string
  active?: boolean
  userRole?: string
  assignedPharmacies?: string[]
}): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  // Search filter - case insensitive regex
  if (params.search) {
    query.pharmacyName = { $regex: params.search, $options: 'i' }
  }

  // Active status filter
  if (params.active !== undefined) {
    query.isActive = params.active
  }

  // Role-based filtering for SUPERVISOR
  if (params.userRole === 'SUPERVISOR' && params.assignedPharmacies) {
    if (params.assignedPharmacies.length === 0) {
      // No pharmacies assigned - return empty
      return { _id: null }
    }
    query._id = { $in: params.assignedPharmacies }
  }

  // ADMIN and SUPER_ADMIN see all pharmacies - no filter needed

  return query
}

// =============================================
// Helper: Build sort options
// =============================================

function buildSortOptions(sortBy?: string): Record<string, 1 | -1> {
  switch (sortBy) {
    case 'name-asc':
      return { pharmacyName: 1 }
    case 'name-desc':
      return { pharmacyName: -1 }
    case 'pending-orders':
      // Will be sorted client-side after aggregation
      return { pharmacyName: 1 }
    case 'pending-expenses':
      // Will be sorted client-side after aggregation
      return { pharmacyName: 1 }
    case 'recent':
      return { updatedAt: -1 }
    default:
      return { pharmacyName: 1 }
  }
}

// =============================================
// Shared service: Get filtered pharmacies with metrics
// =============================================

/**
 * Retrieves filtered pharmacies with metrics (pending requests, expenses, users)
 * @param search - Search term for pharmacy name
 * @param active - Filter by active status (true/false)
 * @param sortBy - Sort option (name-asc, name-desc, pending-orders, pending-expenses, recent)
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 20)
 * @param userRole - Role of the requesting user
 * @param assignedPharmacies - Array of pharmacy IDs assigned to the user
 * @returns Paginated response with pharmacy metrics
 */
export async function getFilteredPharmacies(
  search?: string,
  active?: boolean,
  sortBy?: string,
  page: number = 1,
  pageSize: number = 20,
  userRole?: string,
  assignedPharmacies?: string[]
): Promise<PharmacyMetricsResult> {
  await connectDB()

  // Build pharmacy query
  const pharmacyQuery = buildPharmacyFilter({
    search,
    active,
    userRole,
    assignedPharmacies,
  })

  // Handle empty result case (SUPERVISOR with no assigned pharmacies)
  if (pharmacyQuery._id === null) {
    return {
      data: [],
      page: 1,
      totalPages: 0,
      total: 0,
    }
  }

  // Get pagination
  const skip = (page - 1) * pageSize
  const sortOptions = buildSortOptions(sortBy)

  // 1. Fetch pharmacies with pagination
  const pharmacies = await Pharmacy.find(pharmacyQuery)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .select('_id pharmacyName address phone email isActive createdAt updatedAt')
    .lean()

  if (!pharmacies || pharmacies.length === 0) {
    return {
      data: [],
      page,
      totalPages: 0,
      total: 0,
    }
  }

  const pharmacyIds = pharmacies.map((p: any) => p._id.toString())
  const total = await Pharmacy.countDocuments(pharmacyQuery)
  const totalPages = Math.ceil(total / pageSize)

  // 2. Check cache before executing aggregations
  const cacheKey = getMetricsCacheKey(pharmacyIds, userRole || 'UNKNOWN', active)
  const cachedData = metricsCache.get(cacheKey)

  if (cachedData) {
    // Apply pagination to cached data
    const cachedWithPagination = cachedData as PharmacyMetricsResult
    return {
      ...cachedWithPagination,
      page,
      totalPages,
      total,
    }
  }

  // 3. Execute $facet aggregations for metrics
  // Pending statuses: REQUESTED, VALIDATING, AUTHORIZED, SHIPPED
  const pendingSupplyStatuses = [
    SupplyRequestStatus.REQUESTED,
    SupplyRequestStatus.VALIDATING,
    SupplyRequestStatus.AUTHORIZED,
    SupplyRequestStatus.SHIPPED,
  ]

  // Start of current month for monthly metrics
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Convert to ObjectIds for aggregation queries
  const objectIdPharmacyIds = pharmacyIds.map((id) => new mongoose.Types.ObjectId(id))

  // Execute aggregations in parallel
  const [supplyMetrics, expenseMetrics, users] = await Promise.all([
    // SupplyRequest: pending + delivered orders with $facet
    SupplyRequest.aggregate([
      {
        $facet: {
          pendingSupply: [
            {
              $match: {
                pharmacy: { $in: objectIdPharmacyIds },
                status: { $in: pendingSupplyStatuses },
              },
            },
            {
              $group: {
                _id: '$pharmacy',
                pendingSupplyRequests: { $sum: 1 },
              },
            },
          ],
          deliveredOrders: [
            {
              $match: {
                pharmacy: { $in: objectIdPharmacyIds },
                status: SupplyRequestStatus.RECEIVED,
                createdAt: { $gte: startOfMonth },
              },
            },
            {
              $group: {
                _id: '$pharmacy',
                deliveredOrders: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
    // Expense: pending + monthly with $facet
    Expense.aggregate([
      {
        $facet: {
          pendingExpenses: [
            {
              $match: {
                pharmacy: { $in: objectIdPharmacyIds },
                status: 'PENDIENTE_DE_FACTURAR',
              },
            },
            {
              $group: {
                _id: '$pharmacy',
                pendingExpenses: { $sum: 1 },
              },
            },
          ],
          monthlyExpenses: [
            {
              $match: {
                pharmacy: { $in: objectIdPharmacyIds },
                createdAt: { $gte: startOfMonth },
              },
            },
            {
              $group: {
                _id: '$pharmacy',
                totalExpensesThisMonth: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ]),
    // Users assigned to pharmacies
    User.find({ assignedPharmacies: { $in: pharmacyIds } })
      .select('name email role isActive assignedPharmacies')
      .lean(),
  ])

  // Extract $facet results
  const pendingSupplyResult = supplyMetrics[0]?.pendingSupply || []
  const deliveredOrdersResult = supplyMetrics[0]?.deliveredOrders || []
  const pendingExpensesResult = expenseMetrics[0]?.pendingExpenses || []
  const monthlyExpensesResult = expenseMetrics[0]?.monthlyExpenses || []

  // Build metrics lookup maps
  const supplyMap = new Map(pendingSupplyResult.map((s: any) => [s._id.toString(), s.pendingSupplyRequests]))
  const deliveredOrdersMap = new Map(deliveredOrdersResult.map((d: any) => [d._id.toString(), d.deliveredOrders]))
  const expenseMap = new Map(pendingExpensesResult.map((e: any) => [e._id.toString(), e.pendingExpenses]))
  const monthlyExpensesMap = new Map(monthlyExpensesResult.map((m: any) => [m._id.toString(), m.totalExpensesThisMonth]))

  // Group users by pharmacy
  const usersByPharmacy = new Map<string, IAssignedUser[]>()
  users.forEach((user: any) => {
    user.assignedPharmacies?.forEach((pharmId: string) => {
      const key = pharmId.toString()
      if (!usersByPharmacy.has(key)) {
        usersByPharmacy.set(key, [])
      }
      usersByPharmacy.get(key)!.push({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      })
    })
  })

  // Build response with metrics
  const data: IPharmacyMetrics[] = pharmacies.map((pharmacy: any) => {
    const pharmId = pharmacy._id.toString()

    // Get assigned users
    const assignedUsers = usersByPharmacy.get(pharmId) || []
    const activeUsers = assignedUsers.filter((u: IAssignedUser) => u.isActive).length

    // Get last activity
    const lastActivity = pharmacy.updatedAt?.toISOString() || pharmacy.createdAt?.toISOString()

    // Get metrics values - explicitly cast to number
    const pendingSupply = supplyMap.get(pharmId)
    const pendingExp = expenseMap.get(pharmId)
    const deliveredOrders = deliveredOrdersMap.get(pharmId)
    const monthlyExpenses = monthlyExpensesMap.get(pharmId)

    return {
      _id: pharmId,
      pharmacyName: pharmacy.pharmacyName,
      address: pharmacy.address,
      phone: pharmacy.phone,
      email: pharmacy.email,
      isActive: pharmacy.isActive,
      pendingSupplyRequests: typeof pendingSupply === 'number' ? pendingSupply : 0,
      pendingExpenses: typeof pendingExp === 'number' ? pendingExp : 0,
      assignedUsers,
      monthlySummary: {
        totalExpensesThisMonth: typeof monthlyExpenses === 'number' ? monthlyExpenses : 0,
        deliveredOrders: typeof deliveredOrders === 'number' ? deliveredOrders : 0,
        activeUsers,
        lastActivity,
      },
      createdAt: pharmacy.createdAt?.toISOString(),
      updatedAt: pharmacy.updatedAt?.toISOString(),
    }
  })

  // Cache the result (TTL 30s handled by metricsCache)
  const responseData: PharmacyMetricsResult = { data, page, totalPages, total }
  metricsCache.set(cacheKey, { data, total, totalPages })

  return responseData
}

// Export helpers for testing
export { buildPharmacyFilter, buildSortOptions }