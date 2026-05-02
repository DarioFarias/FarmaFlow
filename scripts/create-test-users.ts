/**
 * Script para crear 20 usuarios de prueba en FarmaFlow
 * Uso: npx tsx scripts/create-test-users.ts
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Conexión a MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmaflow'

// Definir interfaz de usuario
interface IUser {
  name: string
  username: string
  email?: string
  password: string
  role: string
  phone?: string
  isActive: boolean
  assignedPharmacies: string[]
}

// Esquema y modelo
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  assignedPharmacies: { type: [String], default: [] },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

const ROLES = ['ADMIN', 'SUPERVISOR', 'ENCARGADO', 'VENDEDOR']

async function createTestUsers() {
  console.log('🔄 Conectando a MongoDB...')
  
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB\n')
    
    // Hashear contraseña base
    const hashedPassword = await bcrypt.hash('test123456', 12)
    
    const users: IUser[] = []
    
    for (let i = 1; i <= 20; i++) {
      const role = ROLES[Math.floor(Math.random() * ROLES.length)]
      
      users.push({
        name: `Usuario de Prueba ${i}`,
        username: `testuser${i}`,
        email: `test${i}@farmaflow.com`,
        password: hashedPassword,
        role,
        phone: `55123456${String(i).padStart(2, '0')}`,
        isActive: true,
        assignedPharmacies: [],
      })
    }
    
    console.log('📦 Insertando 20 usuarios de prueba...')
    
    // Insertar usuarios (ignorar duplicados)
    const result = await User.insertMany(users, { ordered: false })
    
    console.log(`✅ ${result.length} usuarios creados exitosamente`)
    console.log('\n📋 Credenciales de acceso:')
    console.log('   Username: testuser1 - testuser20')
    console.log('   Password: test123456\n')
    console.log('🎯 Roles asignados aleatoriamente: ADMIN, SUPERVISOR, ENCARGADO, VENDEDOR')
    
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      console.log('⚠️  Algunos usuarios ya existen. Limpiando y recreando...')
      
      // Limpiar usuarios de prueba existentes
      await User.deleteMany({ username: { $regex: /^testuser\d+$/ } })
      console.log('✅ Usuarios de prueba anteriores eliminados')
      
      // Reintentar
      const hashedPassword = await bcrypt.hash('test123456', 12)
      
      const users: IUser[] = []
      for (let i = 1; i <= 20; i++) {
        const role = ROLES[Math.floor(Math.random() * ROLES.length)]
        users.push({
          name: `Usuario de Prueba ${i}`,
          username: `testuser${i}`,
          email: `test${i}@farmaflow.com`,
          password: hashedPassword,
          role,
          phone: `55123456${String(i).padStart(2, '0')}`,
          isActive: true,
          assignedPharmacies: [],
        })
      }
      
      await User.insertMany(users, { ordered: false })
      console.log(`✅ 20 usuarios de prueba recreados`)
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Desconectado de MongoDB')
  }
}

createTestUsers()