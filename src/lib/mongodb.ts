import mongoose from 'mongoose'

// =============================================
// FARMAFLOW - Conexión a MongoDB Atlas
// Patrón Singleton para Next.js (reutiliza conexión entre hot-reloads)
// =============================================

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    '[FarmaFlow] Variable MONGODB_URI no definida. Revisa tu archivo .env.local'
  )
}

// Global cache para evitar múltiples conexiones en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'farmaflow',
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('[FarmaFlow] ✅ MongoDB conectado')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
