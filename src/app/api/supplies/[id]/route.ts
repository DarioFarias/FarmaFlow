import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import { isAdmin } from '@/lib/roles'
import { UserRole, SupplyRequestStatus } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()
    const supplyRequest = await SupplyRequest.findById(params.id)

    if (!supplyRequest) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Seguridad básica: solo admins pueden ver cualquier pedido
    // Otros roles solo ven sus propios pedidos
    const isAdminRole = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR
    
    if (!isAdminRole(session.user.role as UserRole) && supplyRequest.pharmacy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json(supplyRequest)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el pedido' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { status, comment, adminNotes, rejectionReason } = await req.json()
    const { id } = params

    await connectDB()
    const supplyRequest = await SupplyRequest.findById(id)

    if (!supplyRequest) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Actualizar estado y agregar historial
    supplyRequest.status = status as SupplyRequestStatus
    
    if (adminNotes) supplyRequest.adminNotes = adminNotes
    if (rejectionReason) supplyRequest.rejectionReason = rejectionReason

    supplyRequest.statusHistory.push({
      status: status as SupplyRequestStatus,
      changedBy: session.user.id,
      changedAt: new Date(),
      comment: comment || adminNotes || rejectionReason
    })

    await supplyRequest.save()

    return NextResponse.json(supplyRequest)
  } catch (error) {
    console.error('API_SUPPLIES_PATCH_ERROR:', error)
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
  }
}
