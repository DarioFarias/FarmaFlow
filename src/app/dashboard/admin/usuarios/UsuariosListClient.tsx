'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { IUser, IPharmacy, UserRole } from '@/types'
import { getCreatableRoles } from '@/lib/roles'
import toast from 'react-hot-toast'

// Components - already exist
import UserTable from '@/components/admin/users/UserTable'
import CreateUserModal from '@/components/admin/users/CreateUserModal'
import EditUserModal from '@/components/admin/users/EditUserModal'
import PasswordModal from '@/components/admin/users/PasswordModal'
import DeleteUserModal from '@/components/admin/users/DeleteUserModal'
import UsersToolbar from './UsersToolbar'
import UsersPagination from './UsersPagination'

interface PaginationInfo {
  page: number
  totalPages: number
  total: number
}

interface UsuariosListClientProps {
  initialData: IUser[]
  initialPagination: PaginationInfo
  pharmacies: IPharmacy[]
  currentUserId: string
  currentUserRole: UserRole
}

export default function UsuariosListClient({
  initialData,
  initialPagination,
  pharmacies,
  currentUserId,
  currentUserRole,
}: UsuariosListClientProps) {
  const { data: session } = useSession()

  // State from props - initial render needs no AJAX
  const [users, setUsers] = useState<IUser[]>(initialData)
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination)
  const [isLoading, setIsLoading] = useState(false)

  // User input state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Action tracking
  const [actionId, setActionId] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)

  // Debounce ref for search - 300ms
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Roles the current user can create
  const creatableRoles = getCreatableRoles(session?.user?.role as UserRole)

  // Debounce search input - 300ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Reset to page 1 when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [debouncedSearch])

  // Fetch users via AJAX when page or search changes
  const fetchUsers = useCallback(async (overrides?: { page?: number; search?: string }) => {
    setIsLoading(true)
    try {
      const page = overrides?.page ?? pagination.page
      const search = overrides?.search ?? debouncedSearch

      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', '20')
      if (search) {
        params.set('search', search)
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener usuarios')
      }

      if (data && Array.isArray(data.data)) {
        setUsers(data.data)
        setPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        })
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Error al cargar usuarios')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, debouncedSearch])

  // Fetch on page or search change (not on initial render)
  useEffect(() => {
    // Skip initial render - data comes from props
    if (debouncedSearch !== '' || pagination.page !== initialPagination.page) {
      fetchUsers()
    }
  }, [pagination.page, debouncedSearch, fetchUsers, initialPagination.page])

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(currentStatus ? 'Usuario desactivado' : 'Usuario activado')
      fetchUsers()
    } catch (error) {
      toast.error('Error al cambiar estado')
    } finally {
      setActionId(null)
    }
  }

  // Modal handlers
  const openCreateModal = () => setShowCreateModal(true)
  const openEditModal = (user: IUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }
  const openPasswordModal = (user: IUser) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }
  const openDeleteModal = (user: IUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  // Refresh after any modal action
  const handleRefresh = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Administración centralizada de usuarios del sistema.
          </p>
        </div>
        <UsersToolbar
          search={searchQuery}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onCreateClick={handleCreateClick}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Usuario</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Rol Actual</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Sucursal</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Estado</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <UserTable
              users={users}
              pharmacies={pharmacies}
              currentUserId={session?.user?.id || currentUserId}
              currentUserRole={session?.user?.role as UserRole || currentUserRole}
              currentUserAssignedPharmacies={session?.user?.assignedPharmacies}
              actionId={actionId}
              onToggleActive={handleToggleActive}
              onEdit={openEditModal}
              onPassword={openPasswordModal}
              onDelete={openDeleteModal}
            />
          </tbody>
        </table>

        <UsersPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        creatableRoles={creatableRoles}
        currentRole={session?.user?.role as UserRole || currentUserRole}
        userAssignedPharmacies={session?.user?.assignedPharmacies as string[] | undefined}
        pharmacies={pharmacies}
        onSuccess={handleRefresh}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        creatableRoles={creatableRoles}
        currentRole={session?.user?.role as UserRole || currentUserRole}
        userAssignedPharmacies={session?.user?.assignedPharmacies as string[] | undefined}
        pharmacies={pharmacies}
        onSuccess={handleRefresh}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        user={selectedUser}
        onClose={() => {
          setShowPasswordModal(false)
          setSelectedUser(null)
        }}
        onSuccess={() => {}}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        onSuccess={handleRefresh}
      />
    </div>
  )
}