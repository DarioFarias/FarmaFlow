/**
 * Seed de prueba para FarmaFlow
 * Crea usuarios de todos los roles y datos de prueba para testing end-to-end
 * 
 * Ejecutar: npx tsx src/scripts/seed-test-data.ts
 */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida')
  process.exit(1)
}

const testUsers = [
  // === SUPER ADMIN ===
  {
    name: 'Dario Farias',
    email: 'dajfarias@gmail.com',
    role: 'SUPER_ADMIN',
    isActive: true,
  },
  // === SUPERVISORES ===
  {
    name: 'Carlos Méndez',
    email: 'supervisor1@farmaflow.com',
    role: 'ADMIN',
    isActive: true,
    password: 'Supervisor123!',
  },
  {
    name: 'Laura Ríos',
    email: 'supervisor2@farmaflow.com',
    role: 'ADMIN',
    isActive: true,
    password: 'Supervisor123!',
  },
  // === FARMACIAS ===
  {
    name: 'Farmacia Centro Norte',
    email: 'farmacia1@farmaflow.com',
    role: 'PHARMACY',
    pharmacyName: 'Centro Norte',
    pharmacyCode: 'FAR-001',
    isActive: true,
    password: 'Farmacia123!',
  },
  {
    name: 'Farmacia Los Robles',
    email: 'farmacia2@farmaflow.com',
    role: 'PHARMACY',
    pharmacyName: 'Los Robles',
    pharmacyCode: 'FAR-002',
    isActive: true,
    password: 'Farmacia123!',
  },
  {
    name: 'Farmacia Villa Sol',
    email: 'farmacia3@farmaflow.com',
    role: 'PHARMACY',
    pharmacyName: 'Villa Sol',
    pharmacyCode: 'FAR-003',
    isActive: true,
    password: 'Farmacia123!',
  },
  {
    name: 'Farmacia El Pinar',
    email: 'farmacia4@farmaflow.com',
    role: 'PHARMACY',
    pharmacyName: 'El Pinar',
    pharmacyCode: 'FAR-004',
    isActive: true,
    password: 'Farmacia123!',
  },
]

async function seedTestData() {
  console.log('⏳ Conectando a MongoDB...')
  await mongoose.connect(MONGODB_URI!)
  console.log('✅ Conectado\n')

  const usersCollection = mongoose.connection.db.collection('users')

  let created = 0
  let skipped = 0

  for (const user of testUsers) {
    const exists = await usersCollection.findOne({ email: user.email })
    if (exists) {
      // Solo actualizar el rol si es necesario (para el Super Admin que ya existe)
      await usersCollection.updateOne(
        { email: user.email },
        { $set: { role: user.role, isActive: user.isActive } }
      )
      console.log(`⚠️  ${user.email} ya existe → Actualizando rol a ${user.role}`)
      skipped++
    } else {
      const plain = (user as any).password || 'FarmaFlow2024!'
      const hashedPassword = await bcrypt.hash(plain, 12)

      await usersCollection.insertOne({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        isActive: user.isActive,
        ...(user.pharmacyName ? { pharmacyName: user.pharmacyName } : {}),
        ...(user.pharmacyCode ? { pharmacyCode: user.pharmacyCode } : {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      console.log(`✅ Creado: ${user.email} [${user.role}]`)
      created++
    }
  }

  console.log(`\n🎉 Seeding completo! ${created} creados, ${skipped} actualizados.`)
  console.log('\n📋 CREDENCIALES DE PRUEBA:')
  console.log('='.repeat(60))
  console.log('🔴 SUPER ADMIN:')
  console.log('   Email: dajfarias@gmail.com')
  console.log('   Pass:  FarmaFlow2024!')
  console.log('')
  console.log('🟡 SUPERVISOR 1 (Carlos Méndez):')
  console.log('   Email: supervisor1@farmaflow.com')
  console.log('   Pass:  Supervisor123!')
  console.log('')
  console.log('🟡 SUPERVISOR 2 (Laura Ríos):')
  console.log('   Email: supervisor2@farmaflow.com')
  console.log('   Pass:  Supervisor123!')
  console.log('')
  console.log('🟢 FARMACIAS (pass: Farmacia123!):')
  console.log('   farmacia1@farmaflow.com → FAR-001 (Centro Norte)')
  console.log('   farmacia2@farmaflow.com → FAR-002 (Los Robles)')
  console.log('   farmacia3@farmaflow.com → FAR-003 (Villa Sol)')
  console.log('   farmacia4@farmaflow.com → FAR-004 (El Pinar)')
  console.log('='.repeat(60))

  await mongoose.disconnect()
  process.exit(0)
}

seedTestData().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
