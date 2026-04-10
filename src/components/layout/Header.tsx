'use client'

import { Menu, LogOut, Search, Bell, User as UserIcon } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void
  userName?: string
  profileImage?: string
}

export function Header({ onMenuClick, userName, profileImage }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        
        {/* Placeholder search input */}
        <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 focus-within:ring-2 ring-brand-500 ring-offset-1 transition-all">
          <Search size={16} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none focus:outline-none text-sm w-48 text-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-gray-200 mx-2"></div>
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard/perfil" className="flex items-center gap-2 group p-1 pr-2 rounded-full hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-brand-100 border border-brand-200 overflow-hidden flex items-center justify-center text-brand-600">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block group-hover:text-brand-700 transition-colors">
              {userName}
            </span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 transition-colors bg-gray-50 hover:bg-rose-50 px-3 py-2 rounded-lg font-medium border border-gray-200 hover:border-rose-200"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
