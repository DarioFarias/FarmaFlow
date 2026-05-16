import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import Pharmacy from '@/models/Pharmacy'
import { authOptions } from '@/lib/auth'
import { getFilteredUsers, GetUsersParams } from '@/lib/services/users'
import connectDB from '@/lib/mongodb'
import UsuariosListClient from './UsuariosListClient'
import { UserRole, IPharmacy } from '@/types'

interface SearchParams {
  page?: string
  search?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Gestión de Usuarios | FarmaFlow',
    description: 'Administración centralizada de usuarios del sistema',
  }
}

export default async function UsuariosAdminPage(props: PageProps) {
  // Get session server-side
  const session = await getServerSession(authOptions)

  // Check authorization
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const userRole = session.user.role as UserRole
  const userId = session.user.id as string
  const userAssignedPharmacies = session.user.assignedPharmacies || []

  // Connect to database for pharmacy lookup
  await connectDB()

  // Parse searchParams (async in Next.js 15+)
  const searchParams = await props.searchParams
  const page = parseInt(searchParams.page || '1', 10)
  const search = searchParams.search || ''

  // Fetch pharmacies - all for ADMIN/SUPER_ADMIN, filtered for SUPERVISOR
  let pharmacies: IPharmacy[] = []

  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    // Admin sees all pharmacies
    const pharmacyDocs = await Pharmacy.find({ isActive: true })
      .select('_id pharmacyName')
      .lean()

    // Map to proper type
    pharmacies = pharmacyDocs.map((p: any) => ({
      _id: p._id.toString(),
      pharmacyName: p.pharmacyName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  } else if (userRole === 'SUPERVISOR') {
    // Supervisor sees only their assigned pharmacies
    const pharmacyDocs = await Pharmacy.find({
      _id: { $in: userAssignedPharmacies },
      isActive: true,
    })
      .select('_id pharmacyName')
      .lean()

    // Map to proper type
    pharmacies = pharmacyDocs.map((p: any) => ({
      _id: p._id.toString(),
      pharmacyName: p.pharmacyName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  }

  // Build params for getFilteredUsers
  const usersParams: GetUsersParams = {
    page,
    pageSize: 20,
    search,
    userRole,
    assignedPharmacies: userAssignedPharmacies,
    currentUserId: userId,
  }

  // Fetch users server-side for initial data
  const usersResult = await getFilteredUsers(usersParams)

  return (
    <UsuariosListClient
      initialData={usersResult.data}
      initialPagination={{
        page: usersResult.page,
        totalPages: usersResult.totalPages,
        total: usersResult.total,
      }}
      pharmacies={pharmacies}
      currentUserId={userId}
      currentUserRole={userRole}
    />
  )
}