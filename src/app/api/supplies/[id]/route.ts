import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import { updateSupplyStatusSchema } from '@/lib/validations'
import { UserRole, ApiResponse, SupplyRequestStatus } from '@/types'

// Transiciones de estado válidas por rol
const VALID_TRANSITIONS: Record<string, SupplyRequestStatus[]> = {
  [UserRole.ADMIN]: [
    SupplyRequestStatus.VALIDATING,
    SupplyRequestStatus.AUTHORIZED,
    SupplyRequestStatus.REJECTED,
    SupplyRequestStatus.SHIPPED,
  ],
  [UserRole.PHARMACY]: [SupplyRequestStatus.RECEIVED],
}

// =============================================
// GET /api/supplies/[id]
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
    const request = await SupplyRequest.findById(params.id).lean()

    if (!request) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    // PHARMACY solo puede ver sus propios pedidos
    if (
      session.user.role === UserRole.PHARMACY &&
      request.pharmacy.toString() !== session.user.id
    ) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data: request })
  } catch (error) {
    console.error('[GET /api/supplies/[id]]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

// =============================================
// PATCH /api/supplies/[id]
// Actualizar estado con validación de máquina de estados
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
    const validation = updateSupplyStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    const { status, comment, rejectionReason, shippingDate, expectedDelivery } = validation.data

    await connectDB()
    const request = await SupplyRequest.findById(params.id)

    if (!request) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Validar transición permitida para este rol
    const allowedTransitions = VALID_TRANSITIONS[session.user.role] ?? []
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `El rol ${session.user.role} no puede mover a estado ${status}` },
        { status: 403 }
      )
    }

    // PHARMACY solo puede actualizar sus propios pedidos
    if (
      session.user.role === UserRole.PHARMACY &&
      request.pharmacy.toString() !== session.user.id
    ) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Aplicar cambios
    request.status = status
    request.statusHistory.push({
      status,
      changedBy: session.user.id,
      changedAt: new Date(),
      comment,
    })

    if (rejectionReason) request.rejectionReason = rejectionReason
    if (shippingDate) request.shippingDate = new Date(shippingDate)
    if (expectedDelivery) request.expectedDelivery = new Date(expectedDelivery)
    if (status === SupplyRequestStatus.RECEIVED) request.receivedAt = new Date()

    await request.save()

    return NextResponse.json<ApiResponse>({ success: true, data: request })
  } catch (error) {
    console.error('[PATCH /api/supplies/[id]]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
