import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import { isSuperAdmin, isAdmin } from '@/lib/roles'
import { UserRole } from '@/types'
import { pharmacyCreateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()
    
    const { searchParams } = new URL(req.url)
    const activeFilter = searchParams.get('active')
    
    let query = {}
    if (activeFilter === 'true') {
      query = { isActive: true }
    } else if (activeFilter === 'false') {
      query = { isActive: false }
    }
    
    const pharmacies = await Pharmacy.find(query).sort({ pharmacyName: 1 })
    
    return NextResponse.json(pharmacies)
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