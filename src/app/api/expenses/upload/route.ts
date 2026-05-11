import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadInvoiceImage } from '@/lib/cloudinary'

// =============================================
// API Route: /api/expenses/upload
// Maneja la subida de imágenes de comprobantes de gastos
// Usa el SDK de Cloudinary del lado del servidor
// =============================================

export async function POST(req: NextRequest) {
  try {
    // 1.1 Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1.2 Extraer file y pharmacyCode del FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const pharmacyCode = formData.get('pharmacyCode') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    if (!pharmacyCode) {
      return NextResponse.json({ error: 'Código de farmacia requerido' }, { status: 400 })
    }

    // 1.3 Convertir el archivo a base64 (Buffer -> base64 data URI)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`

    // Llamar a uploadInvoiceImage del servidor
    const result = await uploadInvoiceImage(base64Data, pharmacyCode)

    // 1.4 Retornar respuesta exitosa
    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    })
  } catch (error) {
    console.error('API_EXPENSES_UPLOAD_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}