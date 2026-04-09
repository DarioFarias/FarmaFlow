import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import User from '@/models/User'
import { createExpenseSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus } from '@/types'

// =============================================
// GET /api/expenses
// ADMIN: todos los gastos | PHARMACY: solo los propios
// =============================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}

    if (session.user.role === UserRole.PHARMACY) {
      filter.pharmacy = session.user.id
    }
    if (status && Object.values(ExpenseStatus).includes(status as ExpenseStatus)) {
      filter.status = status
    }
    if (category) {
      filter.category = category
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ receiptDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: expenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[GET /api/expenses]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

// =============================================
// POST /api/expenses
// Solo PHARMACY puede registrar gastos
// =============================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== UserRole.PHARMACY) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Solo las farmacias pueden registrar gastos' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createExpenseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    await connectDB()

    const pharmacyUser = await User.findById(session.user.id).lean()
    if (!pharmacyUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Farmacia no encontrada' }, { status: 404 })
    }

    const expense = await Expense.create({
      ...validation.data,
      receiptDate: new Date(validation.data.receiptDate),
      pharmacy: session.user.id,
      pharmacyName: pharmacyUser.pharmacyName ?? pharmacyUser.name,
      status: ExpenseStatus.PENDING,
    })

    return NextResponse.json<ApiResponse>({ success: true, data: expense }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/expenses]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
