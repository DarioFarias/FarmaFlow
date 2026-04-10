import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { createUserSchema } from '@/lib/validations'
import { UserRole } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// API Route: POST /api/users
// Crea una nueva farmacia (solo ADMIN)
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

    // 2. Parsear y validar body
    const body = await req.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { name, email, password, pharmacyName, pharmacyCode, phone } = validation.data

    await connectDB()

    // 3. Verificar duplicados (email y código)
    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'El email ya está registrado en otra sucursal.' },
        { status: 400 }
      )
    }

    if (pharmacyCode) {
      const existingCode = await User.findOne({ pharmacyCode: pharmacyCode.toUpperCase() })
      if (existingCode) {
        return NextResponse.json(
          { error: 'El código de farmacia ya está en uso.' },
          { status: 400 }
        )
      }
    }

    // 4. Hashear password y crear usuario
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.PHARMACY, // Siempre pharmacy desde este flujo
      pharmacyName,
      pharmacyCode: pharmacyCode?.toUpperCase(),
      phone,
      isActive: true,
    })

    // 5. Retornar éxito (sin el password)
    return NextResponse.json(
      { 
        message: 'Farmacia creada con éxito',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          pharmacyCode: newUser.pharmacyCode
        } 
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('API_USERS_POST_ERROR:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear la farmacia.' },
      { status: 500 }
    )
  }
}

// Opcional: GET /api/users para listar (también protegido)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()
    const users = await User.find({ role: UserRole.PHARMACY }).sort({ createdAt: -1 })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener farmacias' }, { status: 500 })
  }
}
