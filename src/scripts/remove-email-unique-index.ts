import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Cargar .env desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// =============================================
// Script: Eliminar índice único de email en la colección users
// Ejecutar: npx tsx src/scripts/remove-email-unique-index.ts
// =============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'
console.log('📍 MongoDB URI:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost')

const INDEX_NAME = 'email_1'
const COLLECTION_NAME = 'users'

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    // Obtener referencia a la base de datos
    const db = mongoose.connection.db

    if (!db) {
      throw new Error('No se pudo obtener la referencia a la base de datos')
    }

    // Obtener la colección users
    const collection = db.collection(COLLECTION_NAME)

    // 1. Listar todos los índices actuales
    console.log('\n📋 Índices actuales en la colección users:')
    const indexes = await collection.indexes()
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })

    // 2. Buscar si existe el índice email_1
    const emailIndex = indexes.find((idx: any) => idx.name === INDEX_NAME)

    if (!emailIndex) {
      console.log(`\n⚠️  El índice '${INDEX_NAME}' no existe. Nada que eliminar.`)
      await mongoose.disconnect()
      console.log('✅ Desconectado de MongoDB')
      process.exit(0)
    }

    // 3. Verificar si es único
    console.log(`\n📋 Información del índice '${INDEX_NAME}':`)
    console.log(`   - Es único: ${emailIndex.unique ? 'Sí' : 'No'}`)

    // 4. Eliminar el índice
    console.log(`\n🗑️  Eliminando índice '${INDEX_NAME}'...`)
    await collection.dropIndex(INDEX_NAME)
    console.log(`   ✅ Índice '${INDEX_NAME}' eliminado`)

    // 5. Verificar que se eliminó
    console.log('\n✅ Verificando eliminación...')
    const newIndexes = await collection.indexes()
    const stillExists = newIndexes.some((idx: any) => idx.name === INDEX_NAME)

    if (stillExists) {
      throw new Error(`❌ Error: El índice '${INDEX_NAME}' todavía existe`)
    }

    console.log(`   ✅ El índice '${INDEX_NAME}' fue eliminado correctamente`)
    console.log('\n📋 Índices restantes en la colección users:')
    newIndexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })

    await mongoose.disconnect()
    console.log('\n✅ Desconectado de MongoDB')
    console.log('\n✨ Proceso completado exitosamente!')

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const errorCode = error instanceof Error ? (error as any).code : undefined
    if (errorCode === 85 || errorCode === 86) {
      // Índice no existe - no es error crítico
      console.log(`\n⚠️  El índice '${INDEX_NAME}' no existe o ya fue eliminado`)
      await mongoose.disconnect()
      console.log('✅ Desconectado de MongoDB')
      process.exit(0)
    }
    console.error('\n❌ Error:', message)
    process.exit(1)
  }
}

main()