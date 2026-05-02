import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión activa.' }, { status: 401 })
    }

    const body = await req.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 })
    }

    await connectDB()

    // Obtener el usuario actual de la sesión
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar la contraseña usando bcrypt.compare
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json({ error: 'Error al verificar la contraseña' }, { status: 500 })
  }
}