import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // El Sidebar mostrará "Administración" para ADMIN/SUPER_ADMIN/SUPERVISOR
  // Para ENCARGADO/VENDEDOR, mostrará "Mi Farmacia" (el nombre real se ve en otras partes del UI)
  
  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
