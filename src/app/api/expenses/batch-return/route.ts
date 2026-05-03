import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { batchIdsSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// POST /api/expenses/batch-return
// Return multiple REPORTED expenses to PENDIENTE_DE_PAGO
// For payment processing
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
        { success: false, error: 'Solo el supervisor puede devolver gastos en lote' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = batchIdsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    await connectDB()

    const { expenseIds, notes } = validation.data
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const id of expenseIds) {
      const expense = await Expense.findById(id)
      
      if (!expense) {
        results.push({ id, success: false, error: 'No encontrado' })
        continue
      }

      if (expense.status !== ExpenseStatus.REPORTED) {
        results.push({ id, success: false, error: `Debe estar REPORTADO, estado actual: ${expense.status}` })
        continue
      }

      await Expense.findByIdAndUpdate(
        id,
        {
          status: ExpenseStatus.PENDIENTE_DE_PAGO,
          adminComment: notes || 'Devuelto para pago',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        }
      )
      results.push({ id, success: true })
    }

    const processed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        processed,
        failed,
        total: expenseIds.length,
        results,
      },
    })
  } catch (error) {
    console.error('[POST /api/expenses/batch-return]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}