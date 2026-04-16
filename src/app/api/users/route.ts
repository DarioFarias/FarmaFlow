import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { UserRole } from '@/types'
import { isAdmin } from '@/lib/roles'
import { z } from 'zod'

// =============================================
// API Route: POST /api/users
// DEPRECATED: Este endpoint está en desuso
// Las farmacias ahora se crean en /api/admin/pharmacies
// Los usuarios se crean en /api/admin/users
// =============================================

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión y permisos
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdmin(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere acceso de administrador.' },
        { status: 403 }
      )
    }

    // 2. Parsear y validar body (usando adminCreateUserSchema minimal)
    const body = await req.json()
    
    // Schema inline para crear usuario genérico
    const userSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().optional(),
    })
    const validation = userSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = validation.data
    // NOTE: pharmacyName y pharmacyCode ya no se usan - las farmacias están en colección Pharmacy

    await connectDB()

    // 3. Verificar duplicados (email)
    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'El email ya está registrado en otro usuario.' },
        { status: 400 }
      )
    }

    // 4. Hashear password y crear usuario
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      // NOTE: El rol ya no puede ser PHARMACY desde este endpoint - se usa SUPERVISOR o ADMIN
      role: UserRole.SUPERVISOR, // Rol por defecto para este endpoint
      phone,
      isActive: true,
    })

    // 5. Retornar éxito (sin el password)
    return NextResponse.json(
      { 
        message: 'Usuario creado con éxito',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        } 
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('API_USERS_POST_ERROR:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el usuario.' },
      { status: 500 }
    )
  }
}

// Opcional: GET /api/users para listar usuarios (también protegido)
// NOTE: Este endpoint lista usuarios, NO farmacias
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()
    // NOTE: Ya no filtramos por PHARMACY - listamos todos los usuarios
    const users = await User.find().sort({ createdAt: -1 })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}
