'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { UserRole } from '@/types'

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    name?: string | null
    role: UserRole
    pharmacyName?: string
  }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar 
        role={user.role} 
        pharmacyName={user.pharmacyName} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          userName={user.name || undefined} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50/30 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
