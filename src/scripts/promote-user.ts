import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definida en .env.local')
  process.exit(1)
}

async function promote() {
  try {
    console.log('Conectando a MongoDB...')
    await mongoose.connect(MONGODB_URI!)
    console.log('Conexión exitosa.')

    const email = 'dajfarias@gmail.com'
    
    // Usamos el nombre de la colección directamente para evitar problemas con el modelo de TS
    const db = mongoose.connection.db
    if (!db) {
      console.error('Error: No se pudo obtener la base de datos')
      return
    }
    const usersCollection = db.collection('users')

    const result = await usersCollection.updateOne(
      { email },
      { $set: { role: 'SUPER_ADMIN' } }
    )

    if (result.matchedCount === 0) {
      console.log(`No se encontró el usuario con email: ${email}`)
    } else {
      console.log(`¡Éxito! Usuario ${email} promovido a SUPER_ADMIN.`)
    }

  } catch (error) {
    console.error('Error durante la promoción:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

promote()
