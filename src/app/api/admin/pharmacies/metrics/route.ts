import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import SupplyRequest from '@/models/SupplyRequest'
import Expense from '@/models/Expense'
import User from '@/models/User'
import { isSuperAdmin, isAdmin, isSupervisor, hasPharmacyAccess } from '@/lib/roles'
import { UserRole, SupplyRequestStatus } from '@/types'
import { sanitizeSearchInput, paginationParams } from '@/lib/validations'

// =============================================
// GET /api/admin/pharmacies/metrics
// Returns pharmacy data with metrics (pending requests, expenses, users)
// Role-based access control (SUPERVISOR sees only assigned)
// =============================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role as UserRole
    
    if (!session || !hasPharmacyAccess(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)

    // Parse pagination
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

    // Parse active filter
    const activeFilter = searchParams.get('isActive')
    const isActiveFilter = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined

    // Build base query
    let pharmacyQuery: Record<string, unknown> = {}
    
    if (isActiveFilter !== undefined) {
      pharmacyQuery.isActive = isActiveFilter
    }

    // SUPERVISOR: filter to assigned pharmacies only
    if (isSupervisor(userRole)) {
      const assignedPharmacies = session.user.assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        pharmacyQuery._id = { $in: assignedPharmacies }
      } else {
        // No pharmacies assigned - return empty
        return NextResponse.json({ data: [], total: 0, page, limit: pageSize, totalPages: 0 })
      }
    }

    // Get pagination
    const skip = (page - 1) * pageSize

    // 1. Fetch pharmacies
    const pharmacies = await Pharmacy.find(pharmacyQuery)
      .sort({ pharmacyName: 1 })
      .skip(skip)
      .limit(pageSize)
      .select('pharmacyName address phone email isActive createdAt updatedAt')
      .lean()

    if (!pharmacies || pharmacies.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit: pageSize, totalPages: 0 })
    }

    const pharmacyIds = pharmacies.map((p: any) => p._id)
    const total = await Pharmacy.countDocuments(pharmacyQuery)
    const totalPages = Math.ceil(total / pageSize)

    // 2. Aggregate pending supply requests per pharmacy
    // Pending statuses: REQUESTED, VALIDATING, AUTHORIZED, SHIPPED
    const pendingSupplyStatuses = [
      SupplyRequestStatus.REQUESTED,
      SupplyRequestStatus.VALIDATING,
      SupplyRequestStatus.AUTHORIZED,
      SupplyRequestStatus.SHIPPED,
    ]

    const supplyRequestMetrics = await SupplyRequest.aggregate([
      {
        $match: {
          pharmacy: { $in: pharmacyIds },
          status: { $in: pendingSupplyStatuses },
        },
      },
      {
        $group: {
          _id: '$pharmacy',
          pendingSupplyRequests: { $sum: 1 },
        },
      },
    ])

    // 3. Aggregate pending expenses per pharmacy
    const expenseMetrics = await Expense.aggregate([
      {
        $match: {
          pharmacy: { $in: pharmacyIds },
          status: 'PENDING',
        },
      },
      {
        $group: {
          _id: '$pharmacy',
          pendingExpenses: { $sum: 1 },
        },
      },
    ])

    // 4. Calculate monthly expenses (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          pharmacy: { $in: pharmacyIds },
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$pharmacy',
          totalExpensesThisMonth: { $sum: '$amount' },
        },
      },
    ])

    // 5. Calculate delivered orders this month
    const deliveredOrders = await SupplyRequest.aggregate([
      {
        $match: {
          pharmacy: { $in: pharmacyIds },
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
    ])

    // 6. Get assigned users for each pharmacy
    const users = await User.find({ 
      assignedPharmacies: { $in: pharmacyIds } 
    })
    .select('name email role isActive assignedPharmacies')
    .lean()

    // Build metrics lookup maps
    const supplyMap = new Map(supplyRequestMetrics.map((s: any) => [s._id.toString(), s.pendingSupplyRequests]))
    const expenseMap = new Map(expenseMetrics.map((e: any) => [e._id.toString(), e.pendingExpenses]))
    const monthlyExpensesMap = new Map(monthlyExpenses.map((m: any) => [m._id.toString(), m.totalExpensesThisMonth]))
    const deliveredOrdersMap = new Map(deliveredOrders.map((d: any) => [d._id.toString(), d.deliveredOrders]))

    // Group users by pharmacy
    const usersByPharmacy = new Map<string, any[]>()
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

    // Build response
    const data = pharmacies.map((pharmacy: any) => {
      const pharmId = pharmacy._id.toString()
      
      // Get assigned users
      const assignedUsers = usersByPharmacy.get(pharmId) || []
      const activeUsers = assignedUsers.filter((u: any) => u.isActive).length

      // Get last activity (most recent update from SupplyRequest or Expense)
      const lastActivity = pharmacy.updatedAt?.toISOString() || pharmacy.createdAt?.toISOString()

      return {
        _id: pharmId,
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address,
        phone: pharmacy.phone,
        email: pharmacy.email,
        isActive: pharmacy.isActive,
        pendingSupplyRequests: supplyMap.get(pharmId) || 0,
        pendingExpenses: expenseMap.get(pharmId) || 0,
        assignedUsers,
        monthlySummary: {
          totalExpensesThisMonth: monthlyExpensesMap.get(pharmId) || 0,
          deliveredOrders: deliveredOrdersMap.get(pharmId) || 0,
          activeUsers,
          lastActivity,
        },
        createdAt: pharmacy.createdAt?.toISOString(),
        updatedAt: pharmacy.updatedAt?.toISOString(),
      }
    })

    return NextResponse.json({
      data,
      total,
      page,
      limit: pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching pharmacy metrics:', error)
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 })
  }
}