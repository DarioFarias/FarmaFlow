import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { createExpenseSchema } from '@/lib/validations'
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

    const pharmacyName = session.user.pharmacyName || session.user.name

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

    let query = {}
    const userRole = session.user.role as UserRole
    const userId = session.user.id
    
    // Si es FARMACIA, solo ve sus propios gastos
    if (userRole === UserRole.PHARMACY) {
      query = { pharmacy: userId }
    }
    // Si es SUPERVISOR, solo ve gastos de farmacias asignadas
    else if (userRole === UserRole.SUPERVISOR) {
      const assignedPharmacies = (session.user as any).assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        const { default: User } = await import('@/models/User')
        const assignedUsers = await User.find({ 
          pharmacyCode: { $in: assignedPharmacies } 
        }).select('_id')
        const pharmacyIds = assignedUsers.map(u => u._id)
        query = { pharmacy: { $in: pharmacyIds } }
      } else {
        query = { pharmacy: null }
      }
    }
    // Si es ADMIN o SUPER_ADMIN, ve todos los gastos

    const expenses = await Expense.find(query).sort({ createdAt: -1 })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('API_EXPENSES_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos' },
      { status: 500 }
    )
  }
}
