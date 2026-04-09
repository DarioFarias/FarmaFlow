/**
 * Comprime una imagen en el cliente usando Canvas antes de subirla.
 * @param file El archivo original
 * @param maxWidth Ancho máximo (ej: 1200px)
 * @param quality Calidad de compresión (0 a 1)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionar si es más grande que el máximo
        if (width > maxWidth) {
          height = (maxWidth * height) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No se pudo obtener el contexto del Canvas'))

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Error al comprimir la imagen'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}
