import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { batchIdsSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// POST /api/expenses/batch-approve
// Approve multiple expenses: PENDIENTE_DE_FACTURAR → FACTURADO
// or FACTURADO → REPORTED
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
        { success: false, error: 'Solo el supervisor puede aprobar gastos en lote' },
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
    const currentYear = new Date().getFullYear()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    const period = `${currentYear}-${currentMonth}`

    for (const id of expenseIds) {
      try {
        const expense = await Expense.findById(id)

        if (!expense) {
          results.push({ id, success: false, error: 'No encontrado' })
          continue
        }

        const currentStatus = expense.status as ExpenseStatus
        
        if (currentStatus === ExpenseStatus.PENDIENTE_DE_FACTURAR) {
          if (!expense.pdfUrl || !expense.xmlUrl) {
            results.push({ id, success: false, error: 'Falta pdfUrl o xmlUrl' })
            continue
          }

          await Expense.findByIdAndUpdate(id, {
            status: ExpenseStatus.FACTURADO,
            adminComment: notes,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          })
          results.push({ id, success: true })
        } else if (currentStatus === ExpenseStatus.FACTURADO) {
          await Expense.findByIdAndUpdate(id, {
            status: ExpenseStatus.REPORTED,
            period: period,
            adminComment: notes,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          })
          results.push({ id, success: true })
        } else {
          results.push({ id, success: false, error: `Estado inválido: ${currentStatus}` })
        }
      } catch (err) {
        results.push({ id, success: false, error: 'Error al procesar' })
      }
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
    console.error('[POST /api/expenses/batch-approve]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}