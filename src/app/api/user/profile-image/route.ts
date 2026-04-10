import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { uploadProfileImage, deleteInvoiceImage } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })
    }

    // Convertir file a base64 para Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`

    await connectDB()
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Eliminar imagen anterior si existe
    if (user.profileImagePublicId) {
      await deleteInvoiceImage(user.profileImagePublicId)
    }

    // Subir nueva imagen
    const { url, publicId } = await uploadProfileImage(fileBase64, user.id)

    user.profileImage = url
    user.profileImagePublicId = publicId
    await user.save()

    return NextResponse.json({ url })
  } catch (error) {
    console.error('PROFILE_IMAGE_UPLOAD_ERROR:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
