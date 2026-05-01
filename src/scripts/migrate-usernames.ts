import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI!

async function migrateUsernames() {
  console.log('🔄 Migrando usernames a lowercase...\n')
  console.log('='.repeat(50))
  
  await mongoose.connect(MONGODB_URI)

  const UserSchema = new mongoose.Schema({
    username: String,
    name: String
  }, { collection: 'users' })

  const User = mongoose.model('User', UserSchema)

  // Obtener usuarios actuales
  const usersBefore = await User.find({}, 'username name').lean()
  console.log('\nAntes de la migración:')
  usersBefore.forEach(u => console.log(`  - ${u.username} | ${u.name}`))

  // Migrar a lowercase
  for (const user of usersBefore) {
    if (user.username && user.username !== user.username.toLowerCase()) {
      await User.updateOne(
        { _id: user._id },
        { $set: { username: user.username.toLowerCase() } }
      )
    }
  }

  // Verificar después
  const usersAfter = await User.find({}, 'username name').lean()
  console.log('\nDespués de la migración:')
  usersAfter.forEach(u => console.log(`  - ${u.username} | ${u.name}`))

  await mongoose.disconnect()
  console.log('\n' + '='.repeat(50))
  console.log('✅ Migración completada')
}

migrateUsernames().catch(console.error)