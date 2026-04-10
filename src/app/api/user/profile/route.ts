import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { name, phone } = await req.json()

    await connectDB()
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { name, phone },
      { new: true }
    )

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
