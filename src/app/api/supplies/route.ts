import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SupplyRequest from '@/models/SupplyRequest'
import { createSupplyRequestSchema, paginationParams } from '@/lib/validations'
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

    // El nombre de la farmacia viene del nombre del usuario en la sesión
    const pharmacyName = session.user.name

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

    // Sanitizar y validar parámetros de paginación
    const { searchParams } = new URL(req.url)
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

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
      const assignedPharmacies = session.user.assignedPharmacies || []
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

    // Ejecutar query con paginación
    const skip = (page - 1) * pageSize
    const [requests, total] = await Promise.all([
      SupplyRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      SupplyRequest.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: requests,
      total,
      page,
      limit: pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('API_SUPPLIES_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener los suministros' },
      { status: 500 }
    )
  }
}