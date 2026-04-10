import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin } from '@/lib/roles'
import { UserRole } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado. Se requiere nivel Super Admin.' }, { status: 403 })
    }

    await connectDB()
    const users = await User.find({}).sort({ createdAt: -1 })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}
