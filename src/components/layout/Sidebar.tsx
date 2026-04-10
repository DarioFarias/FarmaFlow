'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { Package, Receipt, Users, Home, LayoutDashboard, Pill, Menu, X, UserCog } from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  role: UserRole
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  profileImage?: string
}

export function Sidebar({ role, pharmacyName, isOpen, setIsOpen, profileImage }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN

  const navItems = isAdmin
    ? [
        { name: 'Dashboard Global', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Suministros', href: '/dashboard/suministros', icon: Package },
        { name: 'Auditoría Gastos', href: '/dashboard/gastos', icon: Receipt },
        { name: 'Farmacias', href: '/dashboard/admin/farmacias', icon: Users },
        ...(role === UserRole.SUPER_ADMIN ? [{ name: 'Gestión Usuarios', href: '/dashboard/admin/usuarios', icon: UserCog }] : []),
      ]
    : [
        { name: 'Inicio', href: '/dashboard', icon: Home },
        { name: 'Mis Pedidos', href: '/dashboard/suministros', icon: Package },
        { name: 'Mis Gastos', href: '/dashboard/gastos', icon: Receipt },
      ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Handle */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="flex bg-brand-500 text-white rounded-lg p-1.5 shadow-sm group-hover:bg-brand-600 transition-colors">
                <Pill size={20} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                FarmaFlow
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {isAdmin ? 'Administración' : pharmacyName || 'Mi Farmacia'}
              </p>
            </div>
            
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`) && item.href !== '/dashboard'
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={18} className={clsx(isActive ? 'text-brand-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer User Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200/60 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 text-white flex items-center justify-center font-bold text-xs shadow-inner overflow-hidden border border-brand-200">
                {profileImage ? (
                  <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  role === UserRole.SUPER_ADMIN ? 'SA' : role === UserRole.ADMIN ? 'AD' : 'SU'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {role === UserRole.SUPER_ADMIN ? 'Super Admin' : role === UserRole.ADMIN ? 'Supervisor' : 'Encargado'}
                </span>
                <span className="text-xs text-brand-600 font-medium">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
