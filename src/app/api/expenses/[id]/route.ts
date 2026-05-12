import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { updateExpenseStatusSchema, updateExpenseSchema } from '@/lib/validations'
import { UserRole, ApiResponse, ExpenseStatus } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// STATUS TRANSITION VALIDATION
// Valid transitions:
// - PENDIENTE_DE_FACTURAR → FACTURADO (requires pdfUrl + xmlUrl)
// - FACTURADO → REPORTED
// - REPORTED → PENDIENTE_DE_PAGO
// - PENDIENTE_DE_PAGO → PAID
// =============================================

const VALID_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  [ExpenseStatus.PENDIENTE_DE_FACTURAR]: [ExpenseStatus.FACTURADO],
  [ExpenseStatus.FACTURADO]: [ExpenseStatus.REPORTED],
  [ExpenseStatus.REPORTED]: [ExpenseStatus.PENDIENTE_DE_PAGO],
  [ExpenseStatus.PENDIENTE_DE_PAGO]: [ExpenseStatus.PAID],
  [ExpenseStatus.PAID]: [],
}

function isValidTransition(fromStatus: ExpenseStatus, toStatus: ExpenseStatus): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false
}

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

    // Check access: admin sees all, non-admin must belong to the expense's pharmacy
    const userRole = session.user.role as UserRole
    const userIsAdmin = isAdmin(userRole)
    const assignedPharmacies = session.user.assignedPharmacies || []
    const expensePharmacyId = expense.pharmacy.toString()

    if (!userIsAdmin && !assignedPharmacies.includes(expensePharmacyId)) {
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
// Phase 2: Status transitions + pharmacy editing
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

    const body = await req.json()
    const userRole = session.user.role as UserRole
    
    // Get expense to check current status
    await connectDB()
    const existingExpense = await Expense.findById(params.id)
    
    if (!existingExpense) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Determine if this is a status change or field update
    const newStatus = body.status
    const isFieldUpdate = !newStatus

    if (newStatus && isAdmin(userRole)) {
      // =============================================
      // SUPERVISOR: Can change status with validation
      // =============================================
      
      // Validate status transition
      const currentStatus = existingExpense.status as ExpenseStatus
      if (!isValidTransition(currentStatus, newStatus)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Transición inválida: ${currentStatus} → ${newStatus}` },
          { status: 400 }
        )
      }

      // Phase 2: Require pdfUrl + xmlUrl for PENDIENTE_DE_FACTURAR → FACTURADO
      if (currentStatus === ExpenseStatus.PENDIENTE_DE_FACTURAR && newStatus === ExpenseStatus.FACTURADO) {
        if (!body.pdfUrl || !body.xmlUrl) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Para FACTURADO se requiere pdfUrl y xmlUrl' },
            { status: 400 }
          )
        }
      }

      // Update with status transition
      const updateData: any = {
        status: newStatus,
        adminComment: body.adminComment,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      }

      // Add CFDI fields if transitioning to FACTURADO
      if (newStatus === ExpenseStatus.FACTURADO) {
        if (body.pdfUrl) updateData.pdfUrl = body.pdfUrl
        if (body.pdfPublicId) updateData.pdfPublicId = body.pdfPublicId
        if (body.xmlUrl) updateData.xmlUrl = body.xmlUrl
        if (body.xmlPublicId) updateData.xmlPublicId = body.xmlPublicId
      }

      // Add period if transitioning to REPORTED
      if (newStatus === ExpenseStatus.REPORTED && body.period) {
        updateData.period = body.period
      }

      const updated = await Expense.findByIdAndUpdate(
        params.id,
        updateData,
        { new: true, runValidators: true }
      )

      return NextResponse.json<ApiResponse>({ success: true, data: updated })
    } else if (!newStatus) {
      // =============================================
      // PHARMACY: Can edit fields while status !== REPORTED
      // =============================================
      // Ownership check: non-admin users can only edit their own pharmacy's expenses
      const userIsAdmin = isAdmin(userRole)
      const assignedPharmacies = session.user.assignedPharmacies || []
      const expensePharmacyId = existingExpense.pharmacy.toString()

      if (!userIsAdmin && !assignedPharmacies.includes(expensePharmacyId)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'No tienes acceso a este gasto' },
          { status: 403 }
        )
      }

      const currentStatus = existingExpense.status as ExpenseStatus

      // Block pharmacy editing when status is REPORTED
      if (currentStatus === ExpenseStatus.REPORTED) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'No puedes editar cuando el gasto está reportado' },
          { status: 403 }
        )
      }

      // Validate fields with schema
      const validation = updateExpenseSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: validation.error.errors[0]?.message },
          { status: 400 }
        )
      }

      // Check if this is a modification after initial creation
      // isModified flag is set if pharmacy edits AND there were already invoice fields
      const wasAlreadyFacturado = currentStatus === ExpenseStatus.FACTURADO
      const isModifyingInvoiceFields = body.pdfUrl || body.xmlUrl
      
      const updateData: any = { ...validation.data }

      // Set wasModified if pharmacy is editing after being FACTURADO
      if (wasAlreadyFacturado && isModifyingInvoiceFields) {
        updateData.wasModified = true
        // If modifying, reset back to PENDIENTE_DE_FACTURAR
        updateData.status = ExpenseStatus.PENDIENTE_DE_FACTURAR
      }

      const updated = await Expense.findByIdAndUpdate(
        params.id,
        updateData,
        { new: true, runValidators: true }
      )

      return NextResponse.json<ApiResponse>({ success: true, data: updated })
    } else {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No tienes permisos para cambiar el estado' }, { status: 403 })
    }
  } catch (error) {
    console.error('[PATCH /api/expenses/[id]]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
