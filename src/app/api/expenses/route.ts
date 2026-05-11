import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { createExpenseSchema, paginationParams } from '@/lib/validations'
import { UserRole, ExpenseStatus } from '@/types'
import { TTLCache } from '@/lib/ttl-cache'

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

    const newExpense = await Expense.create({
      ...validation.data,
      pharmacy: finalPharmacyId,
      pharmacyName: pharmacyName,
      status: ExpenseStatus.PENDING,
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

    // Sanitizar y validar parámetros de paginación
    const { searchParams } = new URL(req.url)
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

    let query = {}
    const userRole = session.user.role as UserRole
    const userId = session.user.id

    // Nota: El rol PHARMACY fue movido a colección Pharmacy
    // Ahora los usuarios normales ven sus propios gastos
    // Los SUPERVISOR ven los gastos de farmacias asignadas
    if (userRole === UserRole.SUPERVISOR) {
      const assignedPharmacies = session.user.assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        // Use TTL cache to avoid redundant Pharmacy queries
        const cacheKey = getPharmacyCacheKey(assignedPharmacies)
        let assignedPharmaciesDocs = pharmacyCache.get(cacheKey)

        if (!assignedPharmaciesDocs) {
          // Cache miss - fetch from database
          const { default: Pharmacy } = await import('@/models/Pharmacy')
          assignedPharmaciesDocs = await Pharmacy.find({
            _id: { $in: assignedPharmacies },
            isActive: true
          }).select('_id') as Array<{ _id: any }>
          // Store in cache
          pharmacyCache.set(cacheKey, assignedPharmaciesDocs)
        }

        const pharmacyIds = assignedPharmaciesDocs.map(p => p._id)
        query = { pharmacy: { $in: pharmacyIds } }
      } else {
        query = { pharmacy: null }
      }
    }
    // ADMIN y SUPER_ADMIN ven todos los gastos

    // Ejecutar query con paginación
    const skip = (page - 1) * pageSize
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select('expenseNumber pharmacy pharmacyName amount currency category description vendor receiptDate status createdAt'),
      Expense.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: expenses,
      total,
      page,
      limit: pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('API_EXPENSES_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}
