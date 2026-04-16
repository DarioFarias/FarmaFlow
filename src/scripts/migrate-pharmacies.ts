import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Cargar .env desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// =============================================
// Script de Migración: users PHARMACY → Pharmacy
// Ejecutar: npx tsx src/scripts/migrate-pharmacies.ts
// =============================================

// Usar la URI de .env.local (atlas) o localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'
console.log('📍 MongoDB URI:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost')

async function migrate() {
  console.log('🔄 Iniciando migración de Pharmacies...\n')

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB')

  // Importar modelos - usar ruta completa
  const User = (await import('../models/User')).default
  const Pharmacy = (await import('../models/Pharmacy')).default

  // 1. Contar usuarios PHARMACY existentes
  const pharmacyUsers = await User.find({ role: 'PHARMACY', isActive: true })
  console.log(`📊 Usuarios con rol PHARMACY encontrados: ${pharmacyUsers.length}`)

  if (pharmacyUsers.length === 0) {
    console.log('⚠️ No hay usuarios PHARMACY para migrar')
    await mongoose.disconnect()
    return
  }

  // 2. Verificar si ya existen farmacias en la nueva colección
  const existingPharmacies = await Pharmacy.countDocuments()
  if (existingPharmacies > 0) {
    console.log(`⚠️ Ya existen ${existingPharmacies} farmacias en la nueva colección`)
    console.log('⚠️ La migración fue cancelada para evitar duplicados')
    console.log('   Si deseas ejecutarla igual, borra primero la colección Pharmacy o elimina el script')
    await mongoose.disconnect()
    return
  }

  // 3. Migrar cada usuario PHARMACY a Pharmacy
  let migrated = 0
  let errors = 0

  for (const user of pharmacyUsers) {
    try {
      // Verificar que tenga pharmacyCode (campo obligatorio)
      if (!user.pharmacyCode) {
        console.log(`⚠️ Usuario ${user.email} sin pharmacyCode - saltando`)
        errors++
        continue
      }

      // Crear documento en Pharmacy
      await Pharmacy.create({
        pharmacyCode: user.pharmacyCode.toUpperCase(),
        pharmacyName: user.pharmacyName || user.name || 'Sin nombre',
        address: undefined, // No existía en User
        phone: user.phone,
        email: user.email, // El email del usuario como email de contacto
        isActive: user.isActive,
      })

      console.log(`✅ Migrado: ${user.pharmacyCode} - ${user.pharmacyName || user.name}`)
      migrated++
    } catch (err: any) {
      console.log(`❌ Error migrando ${user.email}: ${err.message}`)
      errors++
    }
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(50))
  console.log('📋 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(50))
  console.log(`✅ Migrados: ${migrated}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`📊 Total usuarios PHARMACY: ${pharmacyUsers.length}`)

  // 5. Actualizar assignedPharmacies de supervisores existentes
  const supervisors = await User.find({ role: 'SUPERVISOR', isActive: true })
  console.log(`\n👤 Supervisores encontrados: ${supervisors.length}`)

  for (const sup of supervisors) {
    // Los supervisores pueden tener pharmacyCode en sus datos old
    if (sup.pharmacyCode) {
      // Agregar el código a assignedPharmacies si no está
      const codes = sup.assignedPharmacies || []
      if (!codes.includes(sup.pharmacyCode)) {
        sup.assignedPharmacies = [...codes, sup.pharmacyCode]
        await sup.save()
        console.log(`   ➡️ ${sup.email}: asignado ${sup.pharmacyCode}`)
      }
    }
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