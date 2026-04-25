import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin, isAdmin, canCreateRole, canManageUsers, validatePharmacyAssignment, getCreatableRoles } from '@/lib/roles'
import { UserRole } from '@/types'
import { adminCreateUserSchema, paginationParams } from '@/lib/validations'
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

    // Sanitizar y validar parámetros de paginación
    const { searchParams } = new URL(req.url)
    const pagination = paginationParams.safeParse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    })
    const { page, pageSize } = pagination.success ? pagination.data : { page: 1, pageSize: 20 }

    // Sanitizar role filter - solo permite roles que el usuario actual puede ver
    const userRole = session.user.role as UserRole
    const allowedRoles = getCreatableRoles(userRole)
    const roleFilter = searchParams.get('role')
    const sanitizedRole = roleFilter && allowedRoles.includes(roleFilter as UserRole) ? roleFilter : undefined

    // Filtrar por rol solo si es un rol que el usuario actual puede ver
    let query = {}
    if (sanitizedRole) {
      query = { role: sanitizedRole }
    } else {
      // Si no hay filtro específico, solo mostrar roles de nivel inferior
      query = { role: { $in: allowedRoles } }
    }

    // Ejecutar query con paginación
    const skip = (page - 1) * pageSize
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      User.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: users,
      total,
      page,
      limit: pageSize,
      totalPages,
    })
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

    // Validar asignación de farmacias según el rol del creador y del destino
    const pharmacyValidation = validatePharmacyAssignment(
      validated.role as UserRole,
      validated.assignedPharmacies,
      userRole,
      session.user.assignedPharmacies
    )
    if (!pharmacyValidation.valid) {
      return NextResponse.json({ error: pharmacyValidation.error }, { status: 400 })
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
      username: validated.username.trim().toLowerCase(), // Normalizar a lowercase
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
