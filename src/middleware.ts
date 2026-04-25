import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@/types'
import { isAdmin, isSupervisor, hasPharmacyAccess } from '@/lib/roles'

// =============================================
// FARMAFLOW - Middleware RBAC
// Protege rutas según el rol del usuario
// =============================================

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Excluir rutas de NextAuth y login del middleware
    if (pathname.startsWith('/api/auth/') || pathname === '/login') {
      return NextResponse.next()
    }

    const role = token?.role as UserRole | undefined

    // Rutas exclusivas de ADMIN/SUPER_ADMIN + SUPERVISOR
    const pharmacyAccessRoutes = ['/dashboard/admin/farmacias', '/dashboard/admin/usuarios', '/api/admin']
    const isPharmacyAccessRoute = pharmacyAccessRoutes.some((route) => pathname.startsWith(route))

    // Rutas exclusivas de ADMIN/SUPER_ADMIN (sin SUPERVISOR)
    const adminOnlyRoutes = ['/dashboard/admin/configuracion']
    const isAdminOnlyRoute = adminOnlyRoutes.some((route) => pathname.startsWith(route))

    // Rutas que permiten ADMIN/SUPER_ADMIN + SUPERVISOR (gestión de farmacias y usuarios)
    if (isPharmacyAccessRoute && !hasPharmacyAccess(role)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Rutas que permiten solo ADMIN/SUPER_ADMIN (configuración)
    if (isAdminOnlyRoute && !isAdmin(role)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Requiere sesión activa
    },
  }
)

// Matcher: protege dashboard y APIs, excluye login y auth
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/supplies/:path*',
    '/api/expenses/:path*',
    '/api/users/:path*',
    '/api/admin/:path*',
  ],
}
