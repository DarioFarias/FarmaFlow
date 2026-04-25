import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import { isSuperAdmin, isAdmin, isSupervisor, hasPharmacyAccess } from '@/lib/roles'
import { UserRole } from '@/types'
import { pharmacyCreateSchema, sanitizeSearchInput, paginationParams } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role as UserRole
    if (!session || !hasPharmacyAccess(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)

    // Sanitizar y validar parámetros de paginación
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

    // Sanitizar search query
    const searchQuery = searchParams.get('search')
    const sanitizedSearch = searchQuery ? sanitizeSearchInput(searchQuery) : undefined

    // Sanitizar active filter
    const activeFilter = searchParams.get('active')
    const sanitizedActiveFilter = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined

    let query: Record<string, unknown> = {}
    if (sanitizedActiveFilter !== undefined) {
      query.isActive = sanitizedActiveFilter
    }

    // SUPERVISOR: solo puede ver sus farmacias asignadas
    if (isSupervisor(userRole)) {
      const assignedPharmacies = session.user.assignedPharmacies || []
      if (assignedPharmacies.length > 0) {
        // Buscar por _id directamente
        query._id = { $in: assignedPharmacies }
      } else {
        // Si no tiene farmacias asignadas, no ve nada
        query._id = { $in: [] }
      }
    }

    // Aplicar búsqueda por nombre si existe
    if (sanitizedSearch) {
      query.pharmacyName = { $regex: sanitizedSearch, $options: 'i' }
    }

    // Ejecutar query con paginación
    const skip = (page - 1) * pageSize
    const [pharmacies, total] = await Promise.all([
      Pharmacy.find(query)
        .sort({ pharmacyName: 1 })
        .skip(skip)
        .limit(pageSize)
        .select('pharmacyName address phone email isActive createdAt'),
      Pharmacy.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: pharmacies,
      total,
      page,
      limit: pageSize,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    return NextResponse.json({ error: 'Error al obtener farmacias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    
    // Validar con Zod
    const validated = pharmacyCreateSchema.parse(body)
    
    await connectDB()
    
    // Verificar pharmacyName único
    const existingName = await Pharmacy.findOne({ pharmacyName: { $regex: new RegExp(`^${validated.pharmacyName}$`, 'i') } })
    if (existingName) {
      return NextResponse.json({ error: 'Ya existe una farmacia con ese nombre' }, { status: 400 })
    }
    
    // Crear farmacia
    const pharmacy = await Pharmacy.create({
      pharmacyName: validated.pharmacyName,
      address: validated.address || undefined,
      phone: validated.phone || undefined,
      email: validated.email || undefined,
    })

    return NextResponse.json({
      message: 'Farmacia creada correctamente',
      pharmacy: {
        _id: pharmacy._id,
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address,
        phone: pharmacy.phone,
        email: pharmacy.email,
        isActive: pharmacy.isActive,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessages }, { status: 400 })
    }
    console.error('Error creating pharmacy:', error)
    return NextResponse.json({ error: 'Error al crear farmacia' }, { status: 500 })
  }
}