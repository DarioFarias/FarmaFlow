import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Cargar .env desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// =============================================
// Script de Migración: Expense Status V1 → V2
// Ejecutar: npx tsx src/scripts/migrate-expenses-v2.ts [--dry-run]
// =============================================

// Mapeo de estados legacy a nuevos estados
const STATUS_MIGRATION_MAP: Record<string, string> = {
  PENDING: 'PENDIENTE_DE_FACTURAR',     // Pendiente de revisión → Pendiente de facturar
  REVIEWED: 'FACTURADO',                // Revisado → Facturado (supervisor generó factura)
  APPROVED: 'REPORTED',                  // Aprobado → Reportado en CFDI
  DISPUTED: 'PENDIENTE_DE_FACTURAR',     // Disputado → Vuelve a pendientes (requiere resolución)
}

// Usar la URI de .env.local (atlas) o localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'
const DRY_RUN = process.argv.includes('--dry-run')

console.log('📍 MongoDB URI:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost')
console.log('🔍 Dry-run mode:', DRY_RUN ? 'ENABLED (no changes will be made)' : 'DISABLED')
console.log('')

async function migrateExpenses() {
  console.log('🔄 Iniciando migración de gastos a Expense V2...\n')

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB')

  // 1. Contar expenses con estados legacy (usar consulta directa a MongoDB)
  const legacyStatuses = ['PENDING', 'REVIEWED', 'APPROVED', 'DISPUTED']
  const db = mongoose.connection.db
  if (!db) throw new Error('❌ MongoDB connection db is not available')
  const legacyExpenses = await db.collection('expenses').find({ status: { $in: legacyStatuses } }).toArray()

  console.log(`📊 Gastos con estados legacy encontrados: ${legacyExpenses.length}`)
  console.log('')

  if (legacyExpenses.length === 0) {
    console.log('✅ No hay gastos con estados legacy para migrar')
    await mongoose.disconnect()
    return
  }

  // 2. Analizar cada gasto y preparar cambios
  const changes = {
    PENDING: 0,
    REVIEWED: 0,
    APPROVED: 0,
    DISPUTED: 0,
    newFieldsToSet: 0,
  }

  for (const expense of legacyExpenses as any[]) {
    // Contar por tipo de estado
    const status = expense.status as keyof typeof changes
    if (status in changes) {
      changes[status]++
    }

    // Verificar si necesita setear nuevos campos
    if (!expense.pdfUrl || !expense.xmlUrl || expense.isModified === undefined || !expense.period) {
      changes.newFieldsToSet++
    }
  }

  // 3. Mostrar análisis
  console.log('📋 ANÁLISIS DE MIGRACIÓN:')
  console.log('='.repeat(50))
  console.log(`  PENDING → PENDIENTE_DE_FACTURAR:  ${changes.PENDING}`)
  console.log(`  REVIEWED → FACTURADO:            ${changes.REVIEWED}`)
  console.log(`  APPROVED → REPORTED:              ${changes.APPROVED}`)
  console.log(`  DISPUTED → PENDIENTE_DE_FACTURAR: ${changes.DISPUTED}`)
  console.log('')
  console.log(`  Gastos needing new fields:        ${changes.newFieldsToSet}`)
  console.log('')

  // 4. Ejecutar migración si no es dry-run
  if (DRY_RUN) {
    console.log('🔍 [DRY-RUN] No se realizarán cambios')
    console.log('   Ejecuta sin --dry-run para aplicar los cambios')
    await mongoose.disconnect()
    return
  }

  console.log('🚀 Ejecutando migración...\n')

  let migrated = 0
  let errors = 0

  for (const expense of legacyExpenses as any[]) {
    try {
      const oldStatus = expense.status
      const newStatus = STATUS_MIGRATION_MAP[oldStatus]

      // Actualizar documento directamente con MongoDB driver
      await db.collection('expenses').updateOne(
        { _id: expense._id },
        {
          $set: {
            status: newStatus,
            pdfUrl: null,
            xmlUrl: null,
            isModified: false,
            period: null,
          },
        }
      )

      migrated++
    } catch (err: any) {
      console.log(`❌ Error migrando ${expense.expenseNumber}: ${err.message}`)
      errors++
    }
  }

  // 5. Resumen
  console.log('\n' + '='.repeat(50))
  console.log('📋 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(50))
  console.log(`✅ Migrados: ${migrated}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`📊 Total gastos legacy: ${legacyExpenses.length}`)

  console.log('\n🎉 Migración completada!')
  console.log('')
  console.log('📌 NOTAS:')
  console.log('  - Estados migrados: PENDING→PENDIENTE_DE_FACTURAR, REVIEWED→FACTURADO,')
  console.log('    APPROVED→REPORTED, DISPUTED→PENDIENTE_DE_FACTURAR')
  console.log('  - Campos nuevos seteados: pdfUrl=null, xmlUrl=null, isModified=false, period=null')
  console.log('  - Campos category/vendor removidos del modelo (ya no existen en schema)')

  await mongoose.disconnect()
  process.exit(errors > 0 ? 1 : 0)
}

migrateExpenses().catch(async (err) => {
  console.error('❌ Error fatal:', err)
  await mongoose.disconnect()
  process.exit(1)
})