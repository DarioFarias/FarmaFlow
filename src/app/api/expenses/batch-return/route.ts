import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { UserRole, ExpenseStatus } from '@/types'

// =============================================
// API Route: /api/expenses/batch-return
// Bulk return expenses to pending status (for disputes/revisions)
// =============================================

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only ADMIN, SUPER_ADMIN, and SUPERVISOR can batch return
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.SUPERVISOR) {
      return NextResponse.json({ error: 'No tienes permisos para devolver gastos' }, { status: 403 })
    }

    const body = await req.json()
    const { expenseIds } = body

    // Validate expenseIds
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de expenseIds' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find all expenses by IDs
    const expenses = await Expense.find({
      _id: { $in: expenseIds }
    })

    // Check for invalid IDs
    const foundIds = expenses.map(e => e._id.toString())
    const notFoundIds = expenseIds.filter((id: string) => !foundIds.includes(id))

    // Validate: only APPROVED or REVIEWED expenses can be returned to PENDING
    const validExpenses: typeof expenses = []
    const invalidStatusIds: string[] = []

    for (const expense of expenses) {
      if (expense.status === ExpenseStatus.APPROVED || expense.status === ExpenseStatus.REVIEWED) {
        validExpenses.push(expense)
      } else {
        invalidStatusIds.push(expense._id.toString())
      }
    }

    // Perform bulk update for valid expenses
    const processedResults: { id: string, status: string }[] = []
    let modifiedCount = 0

    if (validExpenses.length > 0) {
      const validIds = validExpenses.map(e => e._id)
      
      const result = await Expense.bulkWrite([
        {
          updateMany: {
            filter: { _id: { $in: validIds } },
            update: {
              $set: {
                status: ExpenseStatus.PENDING,
                reviewedBy: null,
                reviewedAt: null
              }
            }
          }
        }
      ])

      modifiedCount = result.modifiedCount

      // Build processed results
      for (const expense of validExpenses) {
        processedResults.push({
          id: expense._id.toString(),
          status: ExpenseStatus.PENDING
        })
      }
    }

    // Build partial errors for invalid IDs
    const partialErrors: { id: string, reason: string }[] = []
    
    for (const id of notFoundIds) {
      partialErrors.push({
        id,
        reason: 'Gasto no encontrado'
      })
    }
    
    for (const id of invalidStatusIds) {
      const expense = expenses.find(e => e._id.toString() === id)
      partialErrors.push({
        id,
        reason: `El gasto no puede ser devuelto (estado actual: ${expense?.status || 'desconocido'})`
      })
    }

    return NextResponse.json({
      success: true,
      processedResults,
      modifiedCount,
      partialErrors: partialErrors.length > 0 ? partialErrors : undefined
    })
  } catch (error) {
    console.error('API_BATCH_RETURN_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al devolver gastos' },
      { status: 500 }
    )
  }
}