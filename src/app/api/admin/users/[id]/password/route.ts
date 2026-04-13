import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin } from '@/lib/roles'
import { UserRole } from '@/types'
import { adminChangePasswordSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = params

    // Validar con Zod
    const validated = adminChangePasswordSchema.parse(body)

    await connectDB()
    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Hash de la nueva contraseña
    user.password = await bcrypt.hash(validated.password, 12)
    await user.save()

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 })
  }
}
