import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin, isAdmin } from '@/lib/roles'
import { UserRole } from '@/types'
import { adminCreateUserSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Roles que un ADMIN puede crear (NO puede crear ADMIN ni SUPER_ADMIN)
const ADMIN_CAN_CREATE_ROLES = [UserRole.SUPERVISOR, UserRole.PHARMACY]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado. Se requiere nivel Admin oSuper Admin.' }, { status: 403 })
    }

    await connectDB()
    
    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')
    
    let query = {}
    if (roleFilter) {
      query = { role: roleFilter }
    }
    
    const users = await User.find(query).sort({ createdAt: -1 })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role as UserRole
    
    // Verificar que el usuario tenga permisos de Admin o Super Admin
    if (!session || (!isSuperAdmin(userRole) && !isAdmin(userRole))) {
      return NextResponse.json({ error: 'No autorizado. Se requiere nivel Admin o Super Admin.' }, { status: 403 })
    }

    const body = await req.json()
    
    // Validar datos con Zod
    const validated = adminCreateUserSchema.parse(body)
    
    await connectDB()
    
    // Verificar permisos de creación de roles
    // SUPER_ADMIN puede crear ADMIN, SUPERVISOR, PHARMACY
    // ADMIN puede crear SUPERVISOR, PHARMACY (NO ADMIN ni SUPER_ADMIN)
    if (!isSuperAdmin(userRole)) {
      if (validated.role === UserRole.ADMIN || validated.role === UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'No tienes permisos para crear rol ' + validated.role }, { status: 403 })
      }
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: validated.email })
    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    // Verificar pharmacyCode único si se proporciona
    if (validated.pharmacyCode) {
      const existingCode = await User.findOne({ pharmacyCode: validated.pharmacyCode })
      if (existingCode) {
        return NextResponse.json({ error: 'El código de sucursal ya está en uso' }, { status: 400 })
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Crear usuario
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: validated.role as UserRole,
      pharmacyName: validated.pharmacyName,
      pharmacyCode: validated.pharmacyCode,
      phone: validated.phone,
      assignedPharmacies: validated.assignedPharmacies || [],
      isActive: true,
    })

    return NextResponse.json({
      message: 'Usuario creado correctamente',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pharmacyName: user.pharmacyName,
        pharmacyCode: user.pharmacyCode,
        phone: user.phone,
        assignedPharmacies: user.assignedPharmacies,
        isActive: user.isActive,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
