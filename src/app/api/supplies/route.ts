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

    const { default: Pharmacy } = await import('@/models/Pharmacy')
    const assignedPharmacies = session.user.assignedPharmacies || []
    const { pharmacyId } = validation.data as { pharmacyId?: string }
    const userRole = session.user.role as UserRole
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN

    let finalPharmacyId: string
    let pharmacyName: string

    if (pharmacyId) {
      // Validar que el usuario tenga acceso a esta farmacia
      // Para ADMIN, permitir cualquier pharmacy activa
      if (!isAdmin && !assignedPharmacies.includes(pharmacyId)) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta farmacia' },
          { status: 403 }
        )
      }

      // Buscar la pharmacy por _id y verificar que existe y está activa
      const pharmacyDoc = await Pharmacy.findOne({
        _id: pharmacyId,
        isActive: true,
      })

      if (!pharmacyDoc) {
        // Verificar si existe pero está inactiva
        const inactivePharmacy = await Pharmacy.findOne({ _id: pharmacyId })
        if (inactivePharmacy) {
          return NextResponse.json(
            { error: 'La farmacia está inactiva' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Farmacia no encontrada' },
          { status: 400 }
        )
      }

      finalPharmacyId = pharmacyDoc._id.toString()
      pharmacyName = pharmacyDoc.pharmacyName
    } else if (isAdmin) {
      // ADMIN sin pharmacyId: requerir pharmacyId explícitamente
      return NextResponse.json(
        { error: 'Debe seleccionar una farmacia para crear el pedido' },
        { status: 400 }
      )
    } else if (assignedPharmacies.length > 0) {
      // USER/SUPERVISOR: usar primera assignedPharmacy como fallback
      const pharmacyDoc = await Pharmacy.findOne({
        _id: assignedPharmacies[0],
        isActive: true,
      })

      if (pharmacyDoc) {
        finalPharmacyId = pharmacyDoc._id.toString()
        pharmacyName = pharmacyDoc.pharmacyName
      } else {
        return NextResponse.json(
          { error: 'No se encontró la farmacia asignada. Contacte al administrador.' },
          { status: 400 }
        )
      }
    } else {
      // Sin assignedPharmacies y no es admin: error
      return NextResponse.json(
        { error: 'No tienes farmacias asignadas. Contacte al administrador.' },
        { status: 400 }
      )
    }

    const newRequest = await SupplyRequest.create({
      ...validation.data,
      pharmacy: finalPharmacyId,
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
        // Filtrar por _id en la colección Pharmacy (no en User)
        const { default: Pharmacy } = await import('@/models/Pharmacy')
        const assignedPharmaciesDocs = await Pharmacy.find({
          _id: { $in: assignedPharmacies },
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
        .limit(pageSize)
        .select('requestNumber pharmacy pharmacyName items status priority createdAt'),
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