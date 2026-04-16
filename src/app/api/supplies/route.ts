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

    // El nombre de la farmacia viene de la sesión (retrocompatibilidad) o del nombre del usuario
    const pharmacyName = (session.user as any).pharmacyName || session.user.name

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
    
    // Si es rol legacy (antigua farmacia), solo ve sus propios pedidos
    // PHARMACY ya no existe como enum, cualquier rol no-admin/supervisor es farmacia
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.SUPERVISOR) {
      query = { pharmacy: userId }
    }
    // Si es SUPERVISOR, solo ve pedidos de farmacias asignadas
    else if (userRole === UserRole.SUPERVISOR) {
      const assignedPharmacies = (session.user as any).assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        // Filtar por pharmacyCode en la colección Pharmacy (no en User)
        const { default: Pharmacy } = await import('@/models/Pharmacy')
        const assignedPharmaciesDocs = await Pharmacy.find({ 
          pharmacyCode: { $in: assignedPharmacies },
          isActive: true
        }).select('_id')
        const pharmacyIds = assignedPharmaciesDocs.map(p => p._id)
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