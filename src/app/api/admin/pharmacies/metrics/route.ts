import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import SupplyRequest from '@/models/SupplyRequest'
import Expense from '@/models/Expense'
import User from '@/models/User'
import { isSuperAdmin, isAdmin, isSupervisor, hasPharmacyAccess } from '@/lib/roles'
import { UserRole, SupplyRequestStatus } from '@/types'
import { sanitizeSearchInput, paginationParams } from '@/lib/validations'
import { metricsCache, getMetricsCacheKey } from '@/lib/metrics-cache'

// =============================================
// GET /api/admin/pharmacies/metrics
// Returns pharmacy data with metrics (pending requests, expenses, users)
// Role-based access control (SUPERVISOR sees only assigned)
// Optimizado con $facet y cache en memoria
// =============================================

export async function GET(req: NextRequest) {
  const startTime = Date.now()

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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = pagination.success ? pagination.data.pageSize : 20

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
      .select('_id pharmacyName address phone email isActive createdAt updatedAt')
      .lean()

    if (!pharmacies || pharmacies.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit: pageSize, totalPages: 0 })
    }

    const pharmacyIds = pharmacies.map((p: any) => p._id.toString())
    const total = await Pharmacy.countDocuments(pharmacyQuery)
    const totalPages = Math.ceil(total / pageSize)

    // 2. Verificar cache antes de ejecutar queries
    const cacheKey = getMetricsCacheKey(pharmacyIds, userRole, isActiveFilter)
    const cachedData = metricsCache.get(cacheKey)

    if (cachedData) {
      const duration = Date.now() - startTime
      console.log(`[Metrics] Cache hit - ${duration}ms`)
      return NextResponse.json({
        ...cachedData,
        page,
        limit: pageSize,
      })
    }

    // 3. Consolidar 4 aggregations en 1 usando $facet
    // Pending statuses: REQUESTED, VALIDATING, AUTHORIZED, SHIPPED
    const pendingSupplyStatuses = [
      SupplyRequestStatus.REQUESTED,
      SupplyRequestStatus.VALIDATING,
      SupplyRequestStatus.AUTHORIZED,
      SupplyRequestStatus.SHIPPED,
    ]

    // Fecha de inicio del mes actual
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Convertir a ObjectIds para las queries de aggregation
    const objectIdPharmacyIds = pharmacyIds.map((id) => new mongoose.Types.ObjectId(id))

    // Ejecutar aggregations en paralelo para mayor eficiencia
    const [supplyMetrics, expenseMetrics, users] = await Promise.all([
      // SupplyRequest: pending + delivered orders con $facet
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
      // Expense: pending + monthly con $facet
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

    // Extraer resultados de $facet
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

    // 4. Guardar en cache (TTL 30s)
    const responseData = { data, total, totalPages }
    metricsCache.set(cacheKey, responseData)

    const duration = Date.now() - startTime
    console.log(`[Metrics] Query completada en ${duration}ms - ${pharmacyIds.length} farmacias`)

    return NextResponse.json({
      ...responseData,
      page,
      limit: pageSize,
    })
  } catch (error) {
    console.error('Error fetching pharmacy metrics:', error)
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 })
  }
}