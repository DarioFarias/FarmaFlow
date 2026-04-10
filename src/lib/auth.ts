import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { UserRole } from '@/types'
import { isAdmin as checkIsAdmin, isPharmacy as checkIsPharmacy } from './roles'

// =============================================
// FARMAFLOW - Configuración de NextAuth.js
// RBAC: roles ADMIN (Supervisor) y PHARMACY (Sucursal)
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        await connectDB()

        // Se usa .select('+password') porque el campo tiene select: false
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          isActive: true,
        }).select('+password')

        if (!user) {
          throw new Error('Credenciales inválidas')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Credenciales inválidas')
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          pharmacyName: user.pharmacyName,
          pharmacyCode: user.pharmacyCode,
          profileImage: user.profileImage,
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
        token.pharmacyName = (user as any).pharmacyName
        token.pharmacyCode = (user as any).pharmacyCode
        token.profileImage = (user as any).profileImage
      }
      return token
    },
    async session({ session, token }) {
      // Exponer datos del JWT en la sesión del cliente
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.pharmacyName = token.pharmacyName as string | undefined
        session.user.pharmacyCode = token.pharmacyCode as string | undefined
        session.user.profileImage = token.profileImage as string | undefined
      }
      return session
    },
  },
}

// ---- Helpers de autorización ----
export function isAdmin(role?: UserRole): boolean {
  return checkIsAdmin(role)
}

export function isPharmacy(role?: UserRole): boolean {
  return checkIsPharmacy(role)
}
