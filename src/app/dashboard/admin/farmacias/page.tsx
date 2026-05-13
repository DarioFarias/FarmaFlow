import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFilteredPharmacies } from '@/lib/services/pharmacies'
import { UserRole } from '@/types'
import { FarmaciasListClient } from './FarmaciasListClient'

// =============================================
// Types
// =============================================

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    status?: string
    sortBy?: string
  }>
}

// =============================================
// Generate metadata for the page
// =============================================

export async function generateMetadata() {
  return {
    title: 'Farmacias | FarmaFlow',
    description: 'Gestiona las sucursales de farmacias en el sistema.',
  }
}

// =============================================
// Server Component: Farmacias Page
// =============================================

export default async function FarmaciasPage({ searchParams }: PageProps) {
  // Get session
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">No autorizado. Por favor, inicia sesión.</p>
      </div>
    )
  }

  // Extract user data from session
  const userRole = session.user?.role as UserRole | undefined
  const assignedPharmacies = session.user?.assignedPharmacies as string[] | undefined

  // Parse search params for filters
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const pageSize = parseInt(params.pageSize || '20', 10)

  // Parse filters
  const search = params.search
  const activeFilter = params.status === 'active' ? true : params.status === 'inactive' ? false : undefined
  const sortBy = params.sortBy

  // Fetch initial data server-side
  const result = await getFilteredPharmacies(
    search,
    activeFilter,
    sortBy,
    page,
    pageSize,
    userRole,
    assignedPharmacies
  )

  // Pass initial data to Client Component
  return (
    <FarmaciasListClient
      initialData={result.data}
      initialPagination={{
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      }}
      userRole={userRole}
    />
  )
}