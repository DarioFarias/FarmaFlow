/**
 * Script de limpieza para eliminar registros huérfanos
 * 
 * Este script identifica y elimina expenses y supplyRequests que tienen
 * un campo 'pharmacy' que no corresponde a un ObjectId válido de Pharmacy.
 * 
 * USO: npx tsx src/scripts/cleanup-orphan-records.ts
 * 
 * WARNING: Este script modifica la base de datos. 
 * - Ejecutar primero en modo DRY-RUN para ver qué se eliminaría
 * - Hacer backup antes de ejecutar
 * - En producción, ejecutar en horario de baja actividad
 * 
 * El script por defecto hace DRY-RUN (no elimina nada).
 * Para eliminar definitivamente, pasar flag --confirm
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Definir esquemas mínimos para el script
const pharmacySchema = new mongoose.Schema({
  pharmacyName: String,
  pharmacyCode: String,
  isActive: Boolean,
}, { _id: true })

const expenseSchema = new mongoose.Schema({
  expenseNumber: String,
  pharmacy: mongoose.Schema.Types.Mixed, // Puede ser ObjectId o string (userId bug)
  pharmacyName: String,
  amount: Number,
  status: String,
  createdAt: Date,
}, { timestamps: true })

const supplyRequestSchema = new mongoose.Schema({
  requestNumber: String,
  pharmacy: mongoose.Schema.Types.Mixed,
  pharmacyName: String,
  status: String,
  createdAt: Date,
}, { timestamps: true })

const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', pharmacySchema)
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
const SupplyRequest = mongoose.models.SupplyRequest || mongoose.model('SupplyRequest', supplyRequestSchema)

async function cleanupOrphanRecords(dryRun = true) {
  const confirmFlag = process.argv.includes('--confirm')
  const isDryRun = !confirmFlag || dryRun

  if (!isDryRun) {
    console.log('⚠️  ATENCIÓN: Este script ELIMINARÁ registros de la base de datos.')
    console.log('   ¿Está seguro? Ejecute con --confirm para confirmar.')
    console.log('')
    console.log('Ejemplo: npx tsx src/scripts/cleanup-orphan-records.ts --confirm')
    return
  }

  console.log('🔍 Script de limpieza de registros huérfanos')
  console.log('=' .repeat(50))
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (solo visualización, sin eliminar)' : 'EJECUCIÓN REAL'}`)
  console.log('')

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!mongoUri) {
    console.error('❌ Error: No se encontró MONGODB_URI en las variables de entorno')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('✅ Conectado a MongoDB\n')

// 1. Obtener todos los Pharmacy ObjectIds válidos
  const pharmacyDocs = await Pharmacy.find({}).select('_id').lean() as { _id: mongoose.Types.ObjectId }[]
  const validPharmacyIds = new Set(
    pharmacyDocs.map(p => p._id.toString())
  )
    console.log(`📋 Farmacias válidas en sistema: ${validPharmacyIds.size}`)

    // 2. Buscar Expenses huérfanos
    // Un expense es huérfano si:
    // - pharmacy no es un ObjectId válido de Pharmacy, O
    // - pharmacy es un string (el bug: user.id en vez de pharmacy._id)
    const allExpenses = await Expense.find({}).select('_id pharmacy pharmacyName createdAt').lean()
    const orphanExpenses = allExpenses.filter(e => {
      const pharm = e.pharmacy?.toString()
      // Es huérfano si pharmacy no es un ObjectId válido de Pharmacy
      return pharm && !validPharmacyIds.has(pharm)
    })

    console.log('')
    console.log('📊 GASTOS (Expenses):')
    console.log(`   Total en DB: ${allExpenses.length}`)
    console.log(`   Huérfanos (pharmacy no corresponde a Pharmacy): ${orphanExpenses.length}`)

    if (orphanExpenses.length > 0) {
      console.log('')
      console.log('   Primeros 5 huérfanos:')
      orphanExpenses.slice(0, 5).forEach(e => {
        console.log(`   - ${e.expenseNumber || e._id}: pharmacy="${e.pharmacy}" (${e.pharmacyName || 'sin nombre'})`)
      })
    }

    // 3. Buscar SupplyRequests huérfanos
    const allSupplyRequests = await SupplyRequest.find({}).select('_id pharmacy pharmacyName createdAt').lean()
    const orphanSupplyRequests = allSupplyRequests.filter(sr => {
      const pharm = sr.pharmacy?.toString()
      return pharm && !validPharmacyIds.has(pharm)
    })

    console.log('')
    console.log('📊 PEDIDOS (SupplyRequests):')
    console.log(`   Total en DB: ${allSupplyRequests.length}`)
    console.log(`   Huérfanos: ${orphanSupplyRequests.length}`)

    if (orphanSupplyRequests.length > 0) {
      console.log('')
      console.log('   Primeros 5 huérfanos:')
      orphanSupplyRequests.slice(0, 5).forEach(sr => {
        console.log(`   - ${sr.requestNumber || sr._id}: pharmacy="${sr.pharmacy}" (${sr.pharmacyName || 'sin nombre'})`)
      })
    }

    // 4. Resumen
    const totalOrphans = orphanExpenses.length + orphanSupplyRequests.length
    console.log('')
    console.log('=' .repeat(50))
    console.log(`📈 TOTAL REGISTROS HUÉRFANOS: ${totalOrphans}`)
    console.log('')

    if (isDryRun) {
      console.log('🔸 MODO DRY-RUN: No se eliminó nada.')
      console.log('   Para ejecutar la eliminación, ejecute:')
      console.log('   npx tsx src/scripts/cleanup-orphan-records.ts --confirm')
    } else {
      // Eliminación real
      console.log('🗑️  Eliminando registros huérfanos...')

      if (orphanExpenses.length > 0) {
        const expenseIds = orphanExpenses.map(e => e._id)
        const deleteExpResult = await Expense.deleteMany({ _id: { $in: expenseIds } })
        console.log(`   ✅ Eliminados ${deleteExpResult.deletedCount} gastos huérfanos`)
      }

      if (orphanSupplyRequests.length > 0) {
        const srIds = orphanSupplyRequests.map(sr => sr._id)
        const deleteSrResult = await SupplyRequest.deleteMany({ _id: { $in: srIds } })
        console.log(`   ✅ Eliminados ${deleteSrResult.deletedCount} pedidos huérfanos`)
      }

      console.log('')
      console.log('✅ Limpieza completada')
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Desconectado de MongoDB')
  }
}

// Ejecutar
cleanupOrphanRecords()