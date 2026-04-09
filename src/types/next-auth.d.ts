import NextAuth from 'next-auth'
import { UserRole } from '@/types'

// =============================================
// Extensión de tipos NextAuth para TypeScript estricto
// Agrega campos custom (role, pharmacyName, etc.) a Session y JWT
// =============================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      pharmacyName?: string
      pharmacyCode?: string
    }
  }

  interface User {
    id: string
    role: UserRole
    pharmacyName?: string
    pharmacyCode?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    pharmacyName?: string
    pharmacyCode?: string
  }
}
