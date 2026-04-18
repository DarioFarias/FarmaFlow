import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { UserRole } from '@/types'
import { isAdmin as checkIsAdmin } from './roles'

// Tipo para usuario retornar en authorize (compatible con next-auth)
interface AuthorizeUser {
  id: string
  name: string
  email?: string | null
  username: string | null
  role: UserRole
  profileImage?: string
  assignedPharmacies: string[]
}

// Tipo para resultado de lean queries (compatible con mongoose moderno)
type LeanUser = {
  _id: { toString(): string }
  name: string
  email?: string | null
  username?: string | null
  password: string
  role: string  // Viene como string desde la DB
  profileImage?: string
  assignedPharmacies?: string[]
}

// =============================================
// FARMAFLOW - Configuración de NextAuth.js
// RBAC: roles ADMIN (Supervisor), SUPER_ADMIN y SUPERVISOR
// =============================================

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        await connectDB()

        const input = credentials.username.trim().toLowerCase() // Normalizar a lowercase

        // 1. Buscar por username (case-sensitive)
        let user: LeanUser | null = await User.findOne({
          username: input,
          isActive: true,
        }).select('+password').lean() as LeanUser | null

        // 2. Fallback: buscar por email
        if (!user) {
          user = await User.findOne({
            email: input,
            isActive: true,
          }).select('+password').lean() as LeanUser | null
        }

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username || null, // null para usuarios legacy
          role: user.role as UserRole,
          profileImage: user.profileImage,
          assignedPharmacies: user.assignedPharmacies || [],
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persistir datos extra en el JWT al hacer login
      if (user) {
        token.id = user.id
        token.role = (user as AuthorizeUser).role as UserRole
        token.profileImage = (user as AuthorizeUser).profileImage
        token.assignedPharmacies = (user as AuthorizeUser).assignedPharmacies || []
        token.username = (user as AuthorizeUser).username || null // null para usuarios legacy
      }
      return token
    },
    async session({ session, token }) {
      // Exponer datos del JWT en la sesión del cliente
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.profileImage = token.profileImage as string | undefined
        session.user.assignedPharmacies = token.assignedPharmacies as string[] | undefined
        session.user.username = token.username as string | null | undefined
      }
      return session
    },
  },
}

// ---- Helpers de autorización ----
export function isAdmin(role?: UserRole): boolean {
  return checkIsAdmin(role)
}
