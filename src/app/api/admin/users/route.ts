import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin, isAdmin, canCreateRole, canManageUsers } from '@/lib/roles'
import { UserRole } from '@/types'
import { adminCreateUserSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Roles que un ADMIN puede crear (NO puede crear ADMIN ni SUPER_ADMIN)
// NOTE: PHARMACY ya no es un rol - las farmacias están en colección Pharmacy
// AHORA SE GESTIONA CON canCreateRole() desde lib/roles.ts

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
    console.log('POST /api/admin/users - body:', JSON.stringify(body))
    
    // Validar datos con Zod
    const validated = adminCreateUserSchema.parse(body)
    console.log('POST /api/admin/users - validated:', JSON.stringify(validated))
    
    await connectDB()
    
    // Verificar permisos de creación de roles usando canCreateRole
    // Nota: userRole ya fue declarado al inicio de la función
    
    // Verificar que el usuario pueda crear usuarios
    if (!canManageUsers(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear usuarios' }, { status: 403 })
    }
    
    // Verificar que el rol destino esté dentro de los permisos
    if (!canCreateRole(userRole, validated.role as UserRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear este rol' }, { status: 403 })
    }

    // Verificar si el username ya existe (case-sensitive)
    if (validated.username) {
      const existingUsername = await User.findOne({ username: validated.username })
      if (existingUsername) {
        return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 })
      }
    }

    // Verificar si el email ya existe (solo si se proporciona)
    if (validated.email) {
      const existingEmail = await User.findOne({ email: validated.email.toLowerCase() })
      if (existingEmail) {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Crear usuario
    const user = await User.create({
      name: validated.name,
      username: validated.username.trim(),
      email: validated.email ? validated.email.toLowerCase().trim() : undefined,
      password: hashedPassword,
      role: validated.role as UserRole,
      phone: validated.phone || undefined,
      assignedPharmacies: validated.assignedPharmacies || [],
      isActive: true,
    })

    return NextResponse.json({
      message: 'Usuario creado correctamente',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedPharmacies: user.assignedPharmacies,
        isActive: user.isActive,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessages }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario: ' + (error as Error).message }, { status: 500 })
  }
}
