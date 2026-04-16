import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@/types'
import { isAdmin } from '@/lib/roles'

// =============================================
// FARMAFLOW - Middleware RBAC
// Protege rutas según el rol del usuario
// =============================================

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    const role = token?.role as UserRole | undefined

    // Rutas exclusivas del ADMIN (Supervisor) y SUPER_ADMIN
    const adminRoutes = ['/dashboard/admin', '/dashboard/farmacias', '/api/admin']
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

    if (isAdminRoute && !isAdmin(role)) {
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

// Matcher: protege todas las rutas bajo /dashboard y /api (excepto auth)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/supplies/:path*',
    '/api/expenses/:path*',
    '/api/users/:path*',
    '/api/admin/:path*',
  ],
}
