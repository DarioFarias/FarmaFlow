'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Shield, Plus, Loader2 } from 'lucide-react'
import { UserRole, IUser, IPharmacy } from '@/types'
import { getCreatableRoles } from '@/lib/roles'
import toast from 'react-hot-toast'

// Componentes extraídos
import UserTable from '@/components/admin/users/UserTable'
import CreateUserModal from '@/components/admin/users/CreateUserModal'
import EditUserModal from '@/components/admin/users/EditUserModal'
import PasswordModal from '@/components/admin/users/PasswordModal'
import DeleteUserModal from '@/components/admin/users/DeleteUserModal'

export default function UsuariosAdminPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<IUser[]>([])
  const [pharmacies, setPharmacies] = useState<IPharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  // Roles del usuario actual
  const currentRole = session?.user?.role as UserRole | undefined

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  
  // Obtener roles que el usuario actual puede crear
  const creatableRoles = getCreatableRoles(session?.user?.role as UserRole)

  useEffect(() => {
    fetchUsers()
    fetchPharmacies()
  }, [])

  const fetchPharmacies = async () => {
    try {
      const res = await fetch('/api/admin/pharmacies')
      const data = await res.json()
      
      // La API devuelve formato paginado: { data: [...], total, page, limit }
      if (data && Array.isArray(data.data)) {
        setPharmacies(data.data as unknown as IPharmacy[])
      } else if (Array.isArray(data)) {
        // Compatibilidad con APIs que devuelven array directo
        setPharmacies(data as unknown as IPharmacy[])
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios')
      
      // La API devuelve formato paginado: { data: [...], total, page, pageSize }
      if (data && Array.isArray(data.data)) {
        setUsers(data.data)
      } else if (Array.isArray(data)) {
        // Compatibilidad con API legacy que devuelve array directo
        setUsers(data)
      } else {
        throw new Error('Formato de datos incorrecto')
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Error al cargar usuarios')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setActionId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      toast.success('Rol actualizado')
      fetchUsers()
    } catch (error) {
      toast.error('No se pudo actualizar el rol')
    } finally {
      setActionId(null)
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="text-brand-600" size={24} />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Administración centralizada de usuarios del sistema.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
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
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
              currentUserAssignedPharmacies={session?.user?.assignedPharmacies}
              actionId={actionId}
              onToggleActive={handleToggleActive}
              onEdit={openEditModal}
              onPassword={openPasswordModal}
              onDelete={openDeleteModal}
            />
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        creatableRoles={creatableRoles}
        currentRole={currentRole}
        userAssignedPharmacies={session?.user?.assignedPharmacies as string[] | undefined}
        pharmacies={pharmacies}
        onSuccess={fetchUsers}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => { setShowEditModal(false); setSelectedUser(null) }}
        creatableRoles={creatableRoles}
        currentRole={currentRole}
        userAssignedPharmacies={session?.user?.assignedPharmacies as string[] | undefined}
        pharmacies={pharmacies}
        onSuccess={fetchUsers}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        user={selectedUser}
        onClose={() => { setShowPasswordModal(false); setSelectedUser(null) }}
        onSuccess={() => {}}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        onClose={() => { setShowDeleteModal(false); setSelectedUser(null) }}
        onSuccess={fetchUsers}
      />
    </div>
  )
}