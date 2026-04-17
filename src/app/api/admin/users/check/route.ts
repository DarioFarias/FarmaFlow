import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin, isAdmin } from '@/lib/roles'
import { UserRole } from '@/types'

// GET /api/admin/users/check?username=valor
// Verifica si un username está disponible
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Requiere sesión activa con rol Admin o Super Admin
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username || username.length < 3) {
      return NextResponse.json({ available: true })
    }

    await connectDB()

    // Verificar si existe usuario con ese username
    const existing = await User.findOne({ username: username.toLowerCase() })

    return NextResponse.json({
      available: !existing,
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ error: 'Error al verificar usuario' }, { status: 500 })
  }
}