import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { batchReportSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// POST /api/expenses/batch-report
// Report multiple FACTURADO expenses to accounting
// Creates/updates Period grouping
// =============================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    
    if (!isAdmin(userRole)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Solo el supervisor puede reportar gastos en lote' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = batchReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    await connectDB()

    const { expenseIds, period, notes } = validation.data
    const results: { id: string; success: boolean; error?: string }[] = []

    // First validate all expenses are FACTURADO
    for (const id of expenseIds) {
      const expense = await Expense.findById(id)
      if (!expense) {
        results.push({ id, success: false, error: 'No encontrado' })
        continue
      }
      if (expense.status !== ExpenseStatus.FACTURADO) {
        results.push({ id, success: false, error: `Debe estar FACTURADO, estado actual: ${expense.status}` })
        continue
      }
      results.push({ id, success: true })
    }

    // If any failed validation, return error
    const invalid = results.filter(r => !r.success)
    if (invalid.length > 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Algunos gastos no pueden ser reportados' },
        { status: 400 }
      )
    }

    // All valid - update all to REPORTED with period
    const updatePromises = expenseIds.map(id =>
      Expense.findByIdAndUpdate(
        id,
        {
          status: ExpenseStatus.REPORTED,
          period: period,
          adminComment: notes,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
        { new: true }
      )
    )

    await Promise.all(updatePromises)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        processed: expenseIds.length,
        period,
        results: expenseIds.map(id => ({ id, success: true })),
      },
    })
  } catch (error) {
    console.error('[POST /api/expenses/batch-report]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}