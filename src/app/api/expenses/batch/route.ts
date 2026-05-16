import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { batchActionSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus, BatchResult } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// HELPER: Require Admin
// =============================================

async function requireAdmin(req: NextRequest): Promise<{ authorized: true } | { authorized: false; response: NextResponse<ApiResponse> }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 }),
    }
  }

  const userRole = session.user.role as UserRole

  if (!isAdmin(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: 'Solo el supervisor puede realizar operaciones en lote' },
        { status: 403 }
      ),
    }
  }

  return { authorized: true }
}

// =============================================
// HANDLER: handleApprove
// Approve expenses: PENDIENTE_DE_FACTURAR → FACTURADO
// Requires pdfUrl + xmlUrl per item
// =============================================

async function handleApprove(
  expenseIds: string[],
  notes?: string,
  session?: any
): Promise<BatchResult> {
  const results: { id: string; success: boolean; error?: string }[] = []

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
      } else if (currentStatus === ExpenseStatus.FACTURADO || currentStatus === ExpenseStatus.REPORTED) {
        results.push({ id, success: false, error: 'Gasto ya facturado o reportado' })
      } else {
        results.push({ id, success: false, error: `Estado inválido: ${currentStatus}` })
      }
    } catch (err) {
      results.push({ id, success: false, error: 'Error al procesar' })
    }
  }

  const processed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    processed,
    failed,
    total: expenseIds.length,
    results,
  }
}

// =============================================
// HANDLER: handleReport
// Report expenses: FACTURADO → REPORTED
// Atomic - all or nothing
// =============================================

async function handleReport(
  expenseIds: string[],
  period: string,
  notes?: string,
  session?: any
): Promise<BatchResult> {
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

  // If any failed validation, return error (atomic)
  const invalid = results.filter(r => !r.success)
  if (invalid.length > 0) {
    return {
      processed: 0,
      failed: expenseIds.length,
      total: expenseIds.length,
      results,
    }
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

  return {
    processed: expenseIds.length,
    failed: 0,
    total: expenseIds.length,
    results: expenseIds.map(id => ({ id, success: true })),
  }
}

// =============================================
// HANDLER: handleReturn
// Return expenses: REPORTED → PENDIENTE_DE_PAGO
// Per-item processing (partial success allowed)
// =============================================

async function handleReturn(
  expenseIds: string[],
  notes?: string,
  session?: any
): Promise<BatchResult> {
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

  return {
    processed,
    failed,
    total: expenseIds.length,
    results,
  }
}

// =============================================
// POST /api/expenses/batch
// Unified batch handler with action dispatch
// =============================================

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const authResult = await requireAdmin(req)
    if (!authResult.authorized) {
      return authResult.response
    }

    const session = await getServerSession(authOptions)

    // 2. Parse and validate body
    const body = await req.json()
    const validation = batchActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    // 3. Connect to DB
    await connectDB()

    // 4. Dispatch by action
    const validatedData = validation.data

    let batchResult: BatchResult

    switch (validatedData.action) {
      case 'approve':
        batchResult = await handleApprove(validatedData.expenseIds, validatedData.notes, session)
        break

      case 'report':
        batchResult = await handleReport(
          validatedData.expenseIds,
          validatedData.period,
          validatedData.notes,
          session
        )

        // If atomic operation failed (some not FACTURADO), return error
        if (batchResult.failed > 0 && batchResult.processed === 0) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Algunos gastos no pueden ser reportados' },
            { status: 400 }
          )
        }
        break

      case 'return':
        batchResult = await handleReturn(validatedData.expenseIds, validatedData.notes, session)
        break

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Acción inválida' },
          { status: 400 }
        )
    }

    // 5. Return standardized response
    return NextResponse.json<ApiResponse<BatchResult>>({
      success: true,
      data: batchResult,
    })
  } catch (error) {
    console.error('[POST /api/expenses/batch]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}