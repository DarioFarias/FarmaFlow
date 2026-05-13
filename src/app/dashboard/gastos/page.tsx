import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFilteredExpenses } from '@/lib/services/expenses'
import { isAdminUser } from '@/lib/roles'
import { UserRole } from '@/types'
import { GastosListClient } from './GastosListClient'
import { IExpenseResponse } from '@/types/api-responses'

// =============================================
// Types for Server Component
// =============================================

interface PharmacyOption {
  pharmacyId: string
  pharmacyName: string
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    status?: string
    pharmacyId?: string
    startDate?: string
    endDate?: string
  }>
}

// =============================================
// Generate metadata for the page
// =============================================
export async function generateMetadata() {
  return {
    title: 'Gastos | FarmaFlow',
    description: 'Registra y gestiona los gastos operativos de tu farmacia.',
  }
}

// =============================================
// Server Component: Gastos Page
// =============================================
export default async function GastosPage({ searchParams }: PageProps) {
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
  const userId = session.user?.id as string
  const assignedPharmacies = session.user?.assignedPharmacies as string[] || []

  // Parse search params for filters
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const pageSize = parseInt(params.pageSize || '20', 10)

  // Build filters object
  const filters = {
    status: params.status,
    pharmacyId: params.pharmacyId,
    startDate: params.startDate,
    endDate: params.endDate,
  }

  // Fetch initial data server-side
  const result = await getFilteredExpenses(
    filters.status || filters.pharmacyId || filters.startDate || filters.endDate
      ? filters
      : undefined,
    userRole || UserRole.VENDEDOR, // Default to VENDEDOR if no role
    userId,
    assignedPharmacies,
    page,
    pageSize
  )

  // Fetch pharmacies for admin filter
  let pharmacies: PharmacyOption[] = []
  if (isAdminUser(userRole)) {
    try {
      const { default: Pharmacy } = await import('@/models/Pharmacy')
      const pharmacyDocs = await Pharmacy.find({ isActive: true })
        .select('_id pharmacyName')
        .sort({ pharmacyName: 1 })
        .limit(100)

      pharmacies = pharmacyDocs.map((p: { _id: { toString(): string }; pharmacyName: string }) => ({
        pharmacyId: p._id.toString(),
        pharmacyName: p.pharmacyName,
      }))
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
    }
  }

  // Pass initial data to Client Component
  return (
    <GastosListClient
      initialGastos={result.data as IExpenseResponse[]}
      initialPagination={{
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      }}
      userRole={userRole}
      pharmacies={pharmacies}
    />
  )
}