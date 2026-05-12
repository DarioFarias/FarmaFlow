import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { createExpenseSchema, paginationParams, expenseFilterParams } from '@/lib/validations'
import { UserRole, ExpenseStatus } from '@/types'
import { TTLCache } from '@/lib/ttl-cache'
import { isAdmin } from '@/lib/roles'

// TTL cache for Pharmacy queries (60 seconds)
const pharmacyCache = new TTLCache<Array<{ _id: any }>>(60_000)

/**
 * Generates a cache key for pharmacy queries
 */
function getPharmacyCacheKey(pharmacyIds: string[]): string {
  return [...pharmacyIds].sort().join(',')
}

// =============================================
// API Route: /api/expenses
// Maneja la creación y listado de rendición de gastos
// =============================================

// Helper: build query filters from params
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createExpenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos del gasto inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    await connectDB()

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    const assignedPharmacies = session.user.assignedPharmacies || []
    const { pharmacyId } = validation.data as { pharmacyId?: string }
    const userRole = session.user.role as UserRole
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN

    let finalPharmacyId: string
    let pharmacyName: string

    if (pharmacyId) {
      // Validar que el usuario tenga acceso a esta farmacia
      // Para ADMIN, permitir cualquier pharmacy activa
      if (!isAdmin && !assignedPharmacies.includes(pharmacyId)) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta farmacia' },
          { status: 403 }
        )
      }

      // Buscar la pharmacy por _id y verificar que existe y está activa
      const pharmacyDoc = await Pharmacy.findOne({
        _id: pharmacyId,
        isActive: true,
      })

      if (!pharmacyDoc) {
        // Verificar si existe pero está inactiva
        const inactivePharmacy = await Pharmacy.findOne({ _id: pharmacyId })
        if (inactivePharmacy) {
          return NextResponse.json(
            { error: 'La farmacia está inactiva' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Farmacia no encontrada' },
          { status: 400 }
        )
      }

      finalPharmacyId = pharmacyDoc._id.toString()
      pharmacyName = pharmacyDoc.pharmacyName
    } else if (isAdmin) {
      // ADMIN sin pharmacyId: requerir pharmacyId explícitamente
      return NextResponse.json(
        { error: 'Debe seleccionar una farmacia para crear el gasto' },
        { status: 400 }
      )
    } else if (assignedPharmacies.length > 0) {
      // USER/SUPERVISOR: usar primera assignedPharmacy como fallback
      const pharmacyDoc = await Pharmacy.findOne({
        _id: assignedPharmacies[0],
        isActive: true,
      })

      if (pharmacyDoc) {
        finalPharmacyId = pharmacyDoc._id.toString()
        pharmacyName = pharmacyDoc.pharmacyName
      } else {
        return NextResponse.json(
          { error: 'No se encontró la farmacia asignada. Contacte al administrador.' },
          { status: 400 }
        )
      }
    } else {
      // Sin assignedPharmacies y no es admin: error
      return NextResponse.json(
        { error: 'No tienes farmacias asignadas. Contacte al administrador.' },
        { status: 400 }
      )
    }

    // =============================================
    // Phase 2: Determine initial status based on invoice presence
    // FACTURADO: requires both pdfUrl AND xmlUrl
    // PENDIENTE_DE_FACTURAR: no invoice OR partial invoice
    // =============================================
    const { pdfUrl, xmlUrl } = validation.data as {
      pdfUrl?: string
      xmlPublicId?: string
      xmlUrl?: string
    }

    const hasFullInvoice = pdfUrl && xmlUrl
    const initialStatus = hasFullInvoice
      ? ExpenseStatus.FACTURADO
      : ExpenseStatus.PENDIENTE_DE_FACTURAR

    const newExpense = await Expense.create({
      ...validation.data,
      pharmacy: finalPharmacyId,
      pharmacyName: pharmacyName,
      status: initialStatus,
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('API_EXPENSES_POST_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al procesar la rendición de gasto' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    // Parse pagination params
    const { searchParams } = new URL(req.url)
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

    // Parse filter params
    const filterResult = expenseFilterParams.safeParse({
      status: searchParams.get('status'),
      period: searchParams.get('period'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      pharmacyId: searchParams.get('pharmacyId'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })
    const filters = filterResult.success ? filterResult.data : undefined

    let query: Record<string, unknown> = {}
    const userRole = session.user.role as UserRole
    const userId = session.user.id
    const userIsAdmin = isAdmin(userRole)
    const assignedPharmacies = session.user.assignedPharmacies || []

    // Role-based pharmacy filtering (Bug #1, Bug #6)
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

    return NextResponse.json({
      data: expenses,
      total,
      page,
      limit: pageSize,
      totalPages,
      // Include filters applied for transparency
      filters: filters && (filters.status || filters.period || filters.startDate || filters.endDate)
        ? { status: filters.status, period: filters.period, dateRange: filters.startDate && filters.endDate ? { startDate: filters.startDate, endDate: filters.endDate } : undefined }
        : undefined,
    })
  } catch (error) {
    console.error('API_EXPENSES_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}
