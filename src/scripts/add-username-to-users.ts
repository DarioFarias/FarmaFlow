import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Cargar .env desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// =============================================
// Script de Migración: Agregar username a usuarios existentes
// Ejecutar: npx tsx src/scripts/add-username-to-users.ts
// =============================================

// Usar la URI de .env.local (atlas) o localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'
console.log('📍 MongoDB URI:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost')

/**
 * Deriva un username desde el email
 * @param email - Email del usuario (ej: john.doe@company.com)
 * @returns Username derivado y sanitizado (ej: john.doe)
 */
function deriveUsernameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return 'user'
  }
  
  // Tomar parte antes del @ y sanitizar
  let username = email.split('@')[0].toLowerCase()
  
  // Remover caracteres no válidos para username
  // Mantener solo letras, números y guiones bajos
  username = username.replace(/[^a-z0-9_]/g, '')
  
  // Si queda vacío o muy corto, usar un valor por defecto
  if (username.length < 3) {
    username = 'user'
  }
  
  return username
}

/**
 * Genera un username único, agregando sufijo numérico si hay conflicto
 */
async function generateUniqueUsername(baseUsername: string, UserModel: any): Promise<string> {
  let username = baseUsername
  let counter = 1
  
  // Verificar si existe el username base
  const existing = await UserModel.findOne({ username })
  
  if (!existing) {
    return username
  }
  
  // Si existe, agregar sufijo numérico
  while (await UserModel.findOne({ username })) {
    username = `${baseUsername}${counter}`
    counter++
  }
  
  return username
}

async function migrate() {
  console.log('🔄 Iniciando migración de usernames...\n')

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB')

  // Importar modelo de usuario
  const User = (await import('../models/User')).default

  // 1. Buscar usuarios sin username (isActive: true)
  // Username no existe o está vacío
  const usersToMigrate = await User.find({
    isActive: true,
    $or: [
      { username: { $exists: false } },
      { username: null },
      { username: '' },
    ],
  })

  console.log(`📊 Usuarios encontrados sin username: ${usersToMigrate.length}`)

  if (usersToMigrate.length === 0) {
    console.log('✅ Todos los usuarios activos ya tienen username')
    await mongoose.disconnect()
    return
  }

  // 2. Verificar que todos tengan email (requerido para derivar username)
  const usersWithEmail = usersToMigrate.filter((u: any) => u.email)
  const usersWithoutEmail = usersToMigrate.filter((u: any) => !u.email)

  if (usersWithoutEmail.length > 0) {
    console.log(`⚠️ ${usersWithoutEmail.length} usuarios sin email - no se pueden migrar automáticamente`)
    for (const user of usersWithoutEmail) {
      console.log(`   - ID: ${user._id}, Name: ${user.name}`)
    }
  }

  if (usersWithEmail.length === 0) {
    console.log('⚠️ No hay usuarios con email para migrar')
    await mongoose.disconnect()
    return
  }

  // 3. Migrar cada usuario
  let migrated = 0
  let skipped = 0
  let errors = 0

  console.log('\n🔄 Procesando usuarios...\n')

  for (const user of usersWithEmail as any[]) {
    try {
      // Derivar username desde email
      const baseUsername = deriveUsernameFromEmail(user.email)
      
      // Generar username único
      const uniqueUsername = await generateUniqueUsername(baseUsername, User)
      
      // Actualizar el usuario
      user.username = uniqueUsername
      await user.save()

      console.log(`✅ Migrado: ${user.email} → ${uniqueUsername}`)
      migrated++
    } catch (err: any) {
      // Verificar si es error de duplicado (race condition)
      if (err.code === 11000) {
        console.log(`⚠️ Conflicto de username para ${user.email} - regenerando...`)
        
        // Regenerar con sufijo diferente
        try {
          const baseUsername = deriveUsernameFromEmail(user.email)
          const uniqueUsername = await generateUniqueUsername(baseUsername, User)
          user.username = uniqueUsername
          await user.save()
          console.log(`✅ Migrado (retry): ${user.email} → ${uniqueUsername}`)
          migrated++
        } catch (retryErr: any) {
          console.log(`❌ Error en retry ${user.email}: ${retryErr.message}`)
          errors++
        }
      } else {
        console.log(`❌ Error migrando ${user.email}: ${err.message}`)
        errors++
      }
    }
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(50))
  console.log('📋 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(50))
  console.log(`✅ Migrados: ${migrated}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`📊 Total usuarios sin username: ${usersWithEmail.length}`)

  // 5. Verificar usuarios que todavía no tienen username
  const remaining = await User.countDocuments({
    isActive: true,
    $or: [
      { username: { $exists: false } },
      { username: null },
      { username: '' },
    ],
  })

  if (remaining > 0) {
    console.log(`⚠️ Usuarios restantes sin username: ${remaining}`)
  } else {
    console.log('✅ Todos los usuarios activos now tienen username')
  }

  console.log('\n🎉 Migración completada!')
  await mongoose.disconnect()
  process.exit(0)
}

migrate().catch(async (err) => {
  console.error('❌ Error fatal:', err)
  await mongoose.disconnect()
  process.exit(1)
})
