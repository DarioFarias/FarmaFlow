import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { createExpenseSchema, paginationParams } from '@/lib/validations'
import { UserRole, ExpenseStatus } from '@/types'

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

    // Obtener nombre de farmacia desde la colección Pharmacy usando assignedPharmacies
    let pharmacyName = 'Farmacia'
    const assignedPharmacies = session.user.assignedPharmacies || []
    if (assignedPharmacies.length > 0) {
      const { default: Pharmacy } = await import('@/models/Pharmacy')
      const pharmacyDoc = await Pharmacy.findOne({
        pharmacyCode: assignedPharmacies[0]
      }).select('pharmacyName')
      if (pharmacyDoc) {
        pharmacyName = pharmacyDoc.pharmacyName
      }
    } else {
      // Si no tiene farmacias asignadas, usar el nombre del usuario
      pharmacyName = session.user.name || 'Farmacia'
    }

    const newExpense = await Expense.create({
      ...validation.data,
      pharmacy: session.user.id,
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
        // Filtar por pharmacyCode en la colección Pharmacy (no en User)
        const { default: Pharmacy } = await import('@/models/Pharmacy')
        const assignedPharmaciesDocs = await Pharmacy.find({
          pharmacyCode: { $in: assignedPharmacies },
          isActive: true
        }).select('_id')
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
        .limit(pageSize),
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
