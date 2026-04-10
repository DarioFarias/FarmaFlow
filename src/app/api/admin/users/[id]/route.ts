import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin } from '@/lib/roles'
import { UserRole } from '@/types'
import bcrypt from 'bcryptjs'

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

    await connectDB()
    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Campos permitidos para edición por SA
    if (body.name) user.name = body.name
    if (body.role) user.role = body.role as UserRole
    if (body.isActive !== undefined) user.isActive = body.isActive
    if (body.pharmacyName) user.pharmacyName = body.pharmacyName
    if (body.pharmacyCode) user.pharmacyCode = body.pharmacyCode
    
    // Reset de password por SA (opcional)
    if (body.password) {
      user.password = await bcrypt.hash(body.password, 12)
    }

    await user.save()

    return NextResponse.json({ message: 'Usuario actualizado correctamente' })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}
