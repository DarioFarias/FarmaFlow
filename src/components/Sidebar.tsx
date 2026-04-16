'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  LogOut,
  ChevronRight,
  Pill,
} from 'lucide-react'
import { UserRole } from '@/types'
import clsx from 'clsx'
import { isAdmin } from '@/lib/roles'

// =============================================
// FARMAFLOW - Sidebar (desktop) / Bottom-nav (mobile)
// Layout responsivo Mobile-First
// =============================================

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN],
  },
  {
    href: '/dashboard/suministros',
    label: 'Suministros',
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN],
  },
  {
    href: '/dashboard/gastos',
    label: 'Gastos',
    icon: Receipt,
    roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN],
  },
  {
    href: '/dashboard/farmacias',
    label: 'Farmacias',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const visibleItems = navItems.filter((item) =>
    role ? item.roles.includes(role) : false
  )

  return (
    <>
      {/* ---- SIDEBAR DESKTOP ---- */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 py-6 px-4 gap-2 fixed top-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-6">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500 text-white">
            <Pill size={18} />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            FarmaFlow
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(isActive ? 'nav-link-active' : 'nav-link')}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="px-3 mb-3">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {role === UserRole.SUPER_ADMIN 
                ? 'Super Admin' 
                : role === UserRole.ADMIN 
                  ? 'Supervisor' 
                  : role === UserRole.SUPERVISOR 
                    ? 'Encargado' 
                    : ''}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ---- BOTTOM NAV MOBILE ---- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
