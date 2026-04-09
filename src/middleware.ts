import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@/types'

// =============================================
// FARMAFLOW - Middleware RBAC
// Protege rutas según el rol del usuario
// =============================================

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    const role = token?.role as UserRole | undefined

    // Rutas exclusivas del ADMIN (Supervisor)
    const adminRoutes = ['/dashboard/admin', '/dashboard/farmacias']
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

    if (isAdminRoute && role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Rutas exclusivas de PHARMACY
    const pharmacyRoutes = ['/dashboard/mis-pedidos', '/dashboard/mis-gastos']
    const isPharmacyRoute = pharmacyRoutes.some((route) =>
      pathname.startsWith(route)
    )

    if (isPharmacyRoute && role !== UserRole.PHARMACY) {
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
  ],
}
