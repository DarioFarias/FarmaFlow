import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import User from '@/models/User'
import { createSupplyRequestSchema } from '@/lib/validations'
import { UserRole, ApiResponse, SupplyRequestStatus } from '@/types'

// =============================================
// GET /api/supplies
// ADMIN: lista todos los pedidos
// PHARMACY: lista sólo sus propios pedidos
// =============================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    // Filtro base según rol
    const filter: Record<string, unknown> = {}

    if (session.user.role === UserRole.PHARMACY) {
      filter.pharmacy = session.user.id
    }

    if (status && Object.values(SupplyRequestStatus).includes(status as SupplyRequestStatus)) {
      filter.status = status
    }

    const [requests, total] = await Promise.all([
      SupplyRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupplyRequest.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[GET /api/supplies]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

// =============================================
// POST /api/supplies
// Solo PHARMACY puede crear pedidos
// =============================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== UserRole.PHARMACY) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Solo las farmacias pueden crear pedidos' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createSupplyRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0]?.message },
        { status: 400 }
      )
    }

    await connectDB()

    // Obtener datos actualizados de la farmacia
    const pharmacyUser = await User.findById(session.user.id).lean()
    if (!pharmacyUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Farmacia no encontrada' }, { status: 404 })
    }

    const request = await SupplyRequest.create({
      ...validation.data,
      pharmacy: session.user.id,
      pharmacyName: pharmacyUser.pharmacyName ?? pharmacyUser.name,
      status: SupplyRequestStatus.REQUESTED,
      statusHistory: [
        {
          status: SupplyRequestStatus.REQUESTED,
          changedBy: session.user.id,
          changedAt: new Date(),
          comment: 'Pedido creado por la farmacia',
        },
      ],
    })

    return NextResponse.json<ApiResponse>({ success: true, data: request }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/supplies]', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
