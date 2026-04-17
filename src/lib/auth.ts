import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { UserRole } from '@/types'
import { isAdmin as checkIsAdmin } from './roles'

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

        const input = credentials.username.trim()

        // 1. Buscar por username (case-sensitive)
        let user = await User.findOne({
          username: input,
          isActive: true,
        }).select('+password').lean() as any

        // 2. Fallback: buscar en lowercase (para usuarios legacy)
        if (!user) {
          user = await User.findOne({
            username: input.toLowerCase(),
            isActive: true,
          }).select('+password').lean() as any
        }

        // 3. Fallback adicional: buscar por email
        if (!user) {
          user = await User.findOne({
            email: input.toLowerCase(),
            isActive: true,
          }).select('+password').lean() as any
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
          role: user.role,
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
        token.role = (user as { role: UserRole }).role
        token.profileImage = (user as any).profileImage
        token.assignedPharmacies = (user as any).assignedPharmacies || []
        token.username = (user as any).username || null // null para usuarios legacy
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
