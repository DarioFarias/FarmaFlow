import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import { createSupplyRequestSchema } from '@/lib/validations'
import { UserRole, SupplyRequestStatus } from '@/types'

// =============================================
// API Route: /api/supplies
// Maneja la creación y listado de suministros
// =============================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createSupplyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos del pedido inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    await connectDB()

    // El nombre de la farmacia viene de la sesión para evitar fraudes
    const pharmacyName = session.user.pharmacyName || session.user.name

    const newRequest = await SupplyRequest.create({
      ...validation.data,
      pharmacy: session.user.id,
      pharmacyName: pharmacyName,
      status: SupplyRequestStatus.REQUESTED,
      statusHistory: [
        {
          status: SupplyRequestStatus.REQUESTED,
          changedBy: session.user.name,
          comment: 'Pedido inicial creado por la sucursal',
        },
      ],
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('API_SUPPLIES_POST_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pedido de suministros' },
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

    let query: Record<string, unknown> = {}
    const userRole = session.user.role as UserRole
    const userId = session.user.id
    
    // Si es FARMACIA, solo ve sus propios pedidos
    if (userRole === UserRole.PHARMACY) {
      query = { pharmacy: userId }
    }
    // Si es SUPERVISOR, solo ve pedidos de farmacias asignadas
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
    // Si es ADMIN o SUPER_ADMIN, ve todos los pedidos

    const requests = await SupplyRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json(requests)
  } catch (error) {
    console.error('API_SUPPLIES_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener los suministros' },
      { status: 500 }
    )
  }
}