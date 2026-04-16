import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

// Cargar .env desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

// =============================================
// Script: Eliminar todos los datos y crear Super Admin
// Ejecutar: npx tsx src/scripts/reset-and-create-superadmin.ts
// =============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'
console.log('📍 MongoDB URI:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost')

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    // Definir schemas temporalmente para el script
    const userSchema = new mongoose.Schema({
      name: String,
      username: { type: String, required: true, unique: true, lowercase: true },
      email: { type: String, sparse: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, required: true },
      phone: String,
      isActive: { type: Boolean, default: true },
      profileImage: String,
      assignedPharmacies: [String],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    })

    const pharmacySchema = new mongoose.Schema({
      pharmacyName: { type: String, required: true },
      address: String,
      phone: String,
      email: String,
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    })

    const User = mongoose.models.User || mongoose.model('User', userSchema)
    const Pharmacy = mongoose.models.Pharmacy || mongoose.model('Pharmacy', pharmacySchema)

    // 1. Eliminar todos los usuarios EXCEPTO el que vamos a crear
    console.log('🗑️  Eliminando usuarios existentes...')
    const usersDeleted = await User.deleteMany({})
    console.log(`   ✅ ${usersDeleted.deletedCount} usuarios eliminados`)

    // 2. Eliminar todas las farmacias
    console.log('🗑️  Eliminando farmacias existentes...')
    const pharmaciesDeleted = await Pharmacy.deleteMany({})
    console.log(`   ✅ ${pharmaciesDeleted.deletedCount} farmacias eliminadas`)

    // 3. Crear Super Admin
    console.log('👤 Creando Super Admin...')
    
    const hashedPassword = await bcrypt.hash('admin1234', 12)
    
    const superAdmin = await User.create({
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@farmaflow.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      phone: '',
      isActive: true,
      assignedPharmacies: [],
    })

    console.log('   ✅ Super Admin creado:')
    console.log('      - Username: admin')
    console.log('      - Email: admin@farmaflow.com')
    console.log('      - Contraseña: admin1234')
    console.log('      - Rol: SUPER_ADMIN')

    console.log('\n📋 Credenciales de acceso:')
    console.log('   Usuario: admin')
    console.log('   Contraseña: admin1234')

    await mongoose.disconnect()
    console.log('\n✅ Todo listo!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()