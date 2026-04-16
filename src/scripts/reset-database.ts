import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI!

async function resetDatabase() {
  console.log('⚠️  RESETEO DE BASE DE DATOS\n')
  console.log('='.repeat(50))

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB')

  const User = (await import('../models/User')).default

  // 1. Borrar todas las colecciones
  console.log('\n🗑️  Borrando colecciones...')
  
  await mongoose.connection.dropCollection('pharmacies').catch(() => {})
  console.log('✅ Collection "pharmacies" borrada')

  await mongoose.connection.dropCollection('users').catch(() => {})
  console.log('✅ Collection "users" borrada')

  await mongoose.connection.dropCollection('supplyrequests').catch(() => {})
  console.log('✅ Collection "supplyrequests" borrada')

  await mongoose.connection.dropCollection('expenses').catch(() => {})
  console.log('✅ Collection "expenses" borrada')

  // 2. Crear índice en pharmacyCode (si existe) o干净的
  // No hay más pharmacyCode

  // 3. Crear Super Admin por defecto
  console.log('\n👤 Creando Super Admin...')

  const bcryptModule = await import('bcryptjs')
  const bcrypt = bcryptModule.default || bcryptModule
  
  const superAdminPassword = await bcrypt.hash('SuperAdmin2024!', 12)

  await User.create({
    name: 'Super Admin',
    email: 'admin@farmaflow.com',
    password: superAdminPassword,
    role: 'SUPER_ADMIN',
    phone: '+54 9 11 0000 0000',
    isActive: true,
    assignedPharmacies: [],
  })

  console.log('✅ Super Admin creado:')
  console.log('   Email: admin@farmaflow.com')
  console.log('   Password: SuperAdmin2024!')

  console.log('\n' + '='.repeat(50))
  console.log('🎉 BASE DE DATOS RESETEADA')
  console.log('='.repeat(50))

  await mongoose.disconnect()
  process.exit(0)
}

resetDatabase().catch(async (err) => {
  console.error('❌ Error:', err)
  await mongoose.disconnect()
  process.exit(1)
})