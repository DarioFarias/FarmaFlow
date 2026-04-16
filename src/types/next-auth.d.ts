import NextAuth from 'next-auth'
import { UserRole } from '@/types'

// =============================================
// Extensión de tipos NextAuth para TypeScript estricto
// Agrega campos custom (role, profileImage, assignedPharmacies) a Session y JWT
// =============================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      profileImage?: string
      assignedPharmacies?: string[]
      username?: string | null
    }
  }

  interface User {
    id: string
    role: UserRole
    profileImage?: string
    assignedPharmacies?: string[]
    username?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    profileImage?: string
    assignedPharmacies?: string[]
    username?: string | null
  }
}