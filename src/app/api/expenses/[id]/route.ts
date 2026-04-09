import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { updateExpenseStatusSchema } from '@/lib/validations'
import { UserRole, ApiResponse } from '@/types'

// =============================================
// GET /api/expenses/[id]
// =============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const expense = await Expense.findById(params.id).lean()

    if (!expense) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    if (
      session.user.role === UserRole.PHARMACY &&
      expense.pharmacy.toString() !== session.user.id
    ) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data: expense })
  } catch (error) {
    console.error('[GET /api/expenses/[id]]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

// =============================================
// PATCH /api/expenses/[id]
// Solo ADMIN puede cambiar el estado de un gasto
// =============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Solo el supervisor puede revisar gastos' }, { status: 403 })
    }

    const body = await req.json()
    const validation = updateExpenseStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    await connectDB()
    const expense = await Expense.findByIdAndUpdate(
      params.id,
      {
        status: validation.data.status,
        adminComment: validation.data.adminComment,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    )

    if (!expense) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data: expense })
  } catch (error) {
    console.error('[PATCH /api/expenses/[id]]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
