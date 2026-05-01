import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI!

async function fixDuplicateUsernames() {
  console.log('🔧 Corrigiendo usernames duplicados...\n')
  console.log('='.repeat(50))
  
  await mongoose.connect(MONGODB_URI)

  const UserSchema = new mongoose.Schema({
    username: String,
    name: String,
    role: String
  }, { collection: 'users' })

  const User = mongoose.model('User', UserSchema)

  // Obtener usuarios
  const users = await User.find({}, 'username name role _id').lean()
  
  console.log('\nUsuarios actuales:')
  users.forEach(u => console.log(`  - ${u.username} | ${u.name} | ${u.role}`))

  // Renombrar duplicados
  // El primero "superadmin" se queda, el segundo renombrar a "superadmin2"
  let foundDuplicates = false
  const seenUsernames = new Set<string>()

  for (const user of users) {
    if (seenUsernames.has(user.username!.toLowerCase())) {
      console.log(`\n⚠️ Duplicado encontrado: ${user.username} (${user.name})`)
      
      // Generar nuevo username único
      let newUsername = `${user.username!.toLowerCase()}_${user._id.toString().slice(-4)}`
      
      await User.updateOne(
        { _id: user._id },
        { $set: { username: newUsername } }
      )
      
      console.log(`  → Renombrado a: ${newUsername}`)
      foundDuplicates = true
    }
    seenUsernames.add(user.username!.toLowerCase())
  }

  // Verificar después
  const usersAfter = await User.find({}, 'username name role').lean()
  console.log('\n' + '='.repeat(50))
  console.log('Después de la corrección:')
  usersAfter.forEach(u => console.log(`  - ${u.username} | ${u.name} | ${u.role}`))

  await mongoose.disconnect()
  console.log('\n✅ Corrección completada')
}

fixDuplicateUsernames().catch(console.error)