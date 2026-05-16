import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getCreatableRoles, isSupervisor } from '@/lib/roles'
import { UserRole } from '@/types'

// =============================================
// Types
// =============================================

export interface GetUsersParams {
  page?: number
  pageSize?: number
  search?: string
  userRole?: string
  assignedPharmacies?: string[]
  currentUserId?: string
}

export interface GetUsersResult {
  data: any[]
  total: number
  page: number
  totalPages: number
}

// =============================================
// Helper: Build user query filters
// =============================================

export function buildUserFilter(params: {
  search?: string
  userRole?: string
  assignedPharmacies?: string[]
}): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  // Role-based filtering using getCreatableRoles
  if (params.userRole) {
    const allowedRoles = getCreatableRoles(params.userRole as UserRole)
    if (allowedRoles.length > 0) {
      query.role = { $in: allowedRoles }
    }
  }

  // SUPERVISOR: filter by assigned pharmacies
  if (isSupervisor(params.userRole as UserRole) && params.assignedPharmacies) {
    if (params.assignedPharmacies.length === 0) {
      // Return query that yields no results
      query._id = null
    } else {
      query.assignedPharmacies = { $in: params.assignedPharmacies }
    }
  }

  // Search filter - case insensitive regex via $or
  if (params.search && params.search.trim()) {
    const searchTerm = params.search.trim()
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { username: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
    ]
  }

  return query
}

// =============================================
// Shared service: Get filtered users
// =============================================

/**
 * Retrieves filtered users with pagination and role-based access control
 * Replicates the API route query logic for server-side use in Server Components
 * @param params - Query parameters including page, pageSize, search, userRole, assignedPharmacies
 * @returns Paginated response with user data
 */
export async function getFilteredUsers(params: GetUsersParams): Promise<GetUsersResult> {
  await connectDB()

  // Defaults
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20

  // Handle SUPERVISOR with empty array explicitly passed - return empty early
  // Note: undefined means not provided, empty array [] means explicitly no access
  if (isSupervisor(params.userRole as UserRole) && 
      Array.isArray(params.assignedPharmacies) && 
      params.assignedPharmacies.length === 0) {
    return {
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    }
  }

  // Build query filter
  const query = buildUserFilter({
    search: params.search,
    userRole: params.userRole,
    assignedPharmacies: params.assignedPharmacies,
  })

  // Handle empty query (SUPERVISOR with no pharmacies)
  if (query._id === null) {
    return {
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    }
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize

  // Execute query with pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('name username email role isActive phone assignedPharmacies profileImage createdAt')
      .lean(),
    User.countDocuments(query),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return {
    data: users,
    total,
    page,
    totalPages,
  }
}