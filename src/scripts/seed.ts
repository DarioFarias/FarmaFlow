import { mongoose } from 'mongoose'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida en .env.local')
  process.exit(1)
}

async function seed() {
  try {
    console.log('⏳ Intentando conexión DIRECTA a un shard (bypass SRV/RS)...')
    // Probamos con la URL corta que me pasaste al principio, pero forzando IPv4 en el proceso
    const connectionString = MONGODB_URI;
    console.log('🔗 Usando URI:', connectionString.replace(/:[^:@]+@/, ':****@'))
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ ¡CONECTADO!')

    // Definimos el rol directamente para no depender de imports complejos en el script
    const ADMIN_ROLE = 'ADMIN'
    
    // Verificamos si ya existe el admin
    const adminEmail = 'dajfarias@gmail.com'
    const existingUser = await mongoose.connection.collection('users').findOne({ email: adminEmail })

    if (existingUser) {
      console.log(`ℹ️ El usuario ${adminEmail} ya existe. Saltando creación.`)
    } else {
      console.log(`🧪 Creando usuario administrador: ${adminEmail}`)
      
      const hashedPassword = await bcrypt.hash('FarmaFlow2024!', 12)
      
      const adminUser = {
        name: 'Dario Supervisor',
        email: adminEmail,
        password: hashedPassword,
        role: ADMIN_ROLE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await mongoose.connection.collection('users').insertOne(adminUser)
      console.log('🚀 ¡Admin creado con éxito!')
      console.log('📧 Email: dajfarias@gmail.com')
      console.log('🔑 Password: FarmaFlow2024!')
    }

  } catch (error) {
    console.error('❌ Error durante el seeding:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Desconectado de MongoDB')
    process.exit(0)
  }
}

seed()
