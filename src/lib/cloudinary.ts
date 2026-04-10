import { v2 as cloudinary } from 'cloudinary'

// =============================================
// FARMAFLOW - Configuración de Cloudinary
// Para almacenamiento de fotos de facturas y comprobantes
// =============================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

// ---- Función helper: subir imagen desde base64 o URL ----
export async function uploadInvoiceImage(
  fileData: string,
  pharmacyCode: string
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(fileData, {
    folder: `farmaflow/expenses/${pharmacyCode}`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    tags: ['farmaflow', 'expense', pharmacyCode],
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

// ---- Helper: subir foto de perfil ----
export async function uploadProfileImage(
  fileData: string,
  userId: string
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(fileData, {
    folder: `farmaflow/profiles/${userId}`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

// ---- Función helper: eliminar imagen ----
export async function deleteInvoiceImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
