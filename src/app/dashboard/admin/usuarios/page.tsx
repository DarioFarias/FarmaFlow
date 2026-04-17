'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Shield, UserCog, ToggleLeft, ToggleRight, 
  Loader2, Plus, X, Pencil, Trash2, Eye, EyeOff,
  Mail, Phone, Building, Key, Check
} from 'lucide-react'
import { UserRole, IUser, IPharmacy } from '@/types'
import { getCreatableRoles } from '@/lib/roles'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface UserFormData {
  name: string
  username: string
  email: string
  password: string
  role: UserRole
  phone: string
  assignedPharmacies: string[]
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

const initialFormData: UserFormData = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: UserRole.SUPERVISOR,
  phone: '',
  assignedPharmacies: [],
}

export default function UsuariosAdminPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<IUser[]>([])
  const [pharmacies, setPharmacies] = useState<IPharmacy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  // Roles del usuario actual
  const currentRole = session?.user?.role as UserRole | undefined
  const userAssignedPharmacies = session?.user?.assignedPharmacies as string[] | undefined

  // Función para obtener el nombre de la pharmacy asignada al ENCARGADO
  const getAssignedPharmacyName = () => {
    if (!userAssignedPharmacies || userAssignedPharmacies.length === 0) return 'Sin asignar'
    const pharmacy = pharmacies.find(p => p._id === userAssignedPharmacies[0])
    return pharmacy?.pharmacyName || userAssignedPharmacies[0]
  }
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameChecking, setUsernameChecking] = useState(false)

  // Obtener roles que el usuario actual puede crear
  const creatableRoles = getCreatableRoles(session?.user?.role as UserRole)

  useEffect(() => {
    fetchUsers()
    fetchPharmacies()
  }, [])

  const fetchPharmacies = async () => {
    try {
      // Según el rol del usuario, el API retorna las farmacias apropiadas
      // ADMIN/SUPER_ADMIN: todas las farmacias
      // SUPERVISOR/ENCARGADO: solo las asignadas (el API filtra automáticamente)
      const res = await fetch('/api/admin/pharmacies')
      const data = await res.json()
      if (Array.isArray(data)) {
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
      
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        throw new Error('Formato de datos incorrecto')
      }
    } catch (error: any) {
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

  // Username availability check
  const checkUsernameAvailability = async (username: string, excludeUserId?: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }
    
    setUsernameStatus('checking')
    setUsernameChecking(true)
    
    try {
      const res = await fetch(`/api/admin/users/check?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      
      if (!res.ok) {
        setUsernameStatus('error')
        toast.error('Error al verificar usuario')
        return
      }
      
      if (data.available) {
        setUsernameStatus('available')
      } else {
        setUsernameStatus('taken')
      }
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameStatus('error')
    } finally {
      setUsernameChecking(false)
    }
  }

  // Reset username status when modal closes
  const resetUsernameStatus = () => {
    setUsernameStatus('idle')
    setUsernameChecking(false)
  }

  // Create user handlers
  const openCreateModal = () => {
    setFormData(initialFormData)
    setShowPassword(false)
    setShowCreateModal(true)
    resetUsernameStatus()
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    // Auto-asignar pharmacy si ENCARGADO crea VENDEDOR
    const submitData = { ...formData }
    if (currentRole === UserRole.ENCARGADO && formData.role === UserRole.VENDEDOR && userAssignedPharmacies) {
      submitData.assignedPharmacies = userAssignedPharmacies
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Error al crear usuario')
      
      toast.success('Usuario creado correctamente')
      setShowCreateModal(false)
      fetchUsers()
    } catch (error: any) {
      setFormError(error.message || 'Error al crear usuario')
      toast.error(error.message || 'Error al crear usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

// Edit user handlers
  const openEditModal = (user: IUser) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role as UserRole,
      phone: user.phone || '',
      assignedPharmacies: user.assignedPharmacies || [],
    })
    setFormError(null)
    setShowEditModal(true)
    resetUsernameStatus()
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      // Filtrar campos no vacíos
      const updateData: Partial<UserFormData> = {}
      if (formData.name) updateData.name = formData.name
      if (formData.username) updateData.username = formData.username
      if (formData.email) updateData.email = formData.email
      if (formData.role) updateData.role = formData.role
      if (formData.phone) updateData.phone = formData.phone
      if (formData.role === UserRole.SUPERVISOR || formData.role === UserRole.ADMIN) {
        // Si el creador es ENCARGADO, no puede editar las assignedPharmacies de otros usuarios
        if (currentRole !== UserRole.ENCARGADO) {
          updateData.assignedPharmacies = formData.assignedPharmacies
        }
      }

      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Error al actualizar usuario')
      
      toast.success('Usuario actualizado correctamente')
      setShowEditModal(false)
      fetchUsers()
    } catch (error: any) {
      setFormError(error.message || 'Error al actualizar usuario')
      toast.error(error.message || 'Error al actualizar usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password change handlers
  const openPasswordModal = (user: IUser) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña')
      
      toast.success('Contraseña actualizada correctamente')
      setShowPasswordModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete handlers
  const openDeleteModal = (user: IUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario')
      
      toast.success('Usuario eliminado correctamente')
      setShowDeleteModal(false)
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario')
    } finally {
      setIsSubmitting(false)
    }
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 text-sm italic">
                  No hay usuarios registrados. ¡Crea el primero!
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{u.name}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u._id, e.target.value as UserRole)}
                      disabled={actionId === u._id}
                      className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 ring-brand-500"
                    >
<option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {u.assignedPharmacies?.length ? (
                      <span className="text-xs">{u.assignedPharmacies.join(', ')}</span>
                    ) : (
                      '---'
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset",
                      u.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-red-50 text-red-700 ring-red-600/20"
                    )}>
                      {u.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleToggleActive(u._id, u.isActive)}
                        disabled={actionId === u._id}
                        className={clsx(
                          "p-1.5 rounded-lg transition-colors",
                          u.isActive ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"
                        )}
                        title={u.isActive ? "Desactivar" : "Activar"}
                      >
                        {u.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => openPasswordModal(u)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Cambiar contraseña"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(u)}
                        disabled={
                          u.role === 'SUPER_ADMIN' && u._id === session?.user?.id ||
                          u.role === 'SUPER_ADMIN' && users.filter(user => user.role === 'SUPER_ADMIN' && user.isActive).length <= 1
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                        title={
                          u.role === 'SUPER_ADMIN' && u._id === session?.user?.id 
                            ? 'No puedes eliminar tu propia cuenta'
                            : u.role === 'SUPER_ADMIN' && users.filter(user => user.role === 'SUPER_ADMIN' && user.isActive).length <= 1
                            ? 'No puedes eliminar al último Super Admin'
                            : 'Eliminar usuario'
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value })
                      if (usernameStatus !== 'idle') {
                        setUsernameStatus('idle')
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.length >= 3) {
                        checkUsernameAvailability(e.target.value)
                      }
                    }}
                    className={clsx(
                      "w-full px-3 py-2 pr-10 border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none",
                      usernameStatus === 'available' && "border-emerald-300 bg-emerald-50",
                      usernameStatus === 'taken' && "border-red-300 bg-red-50",
                      usernameStatus === 'error' && "border-gray-300",
                      !usernameStatus || usernameStatus === 'idle' ? "border-gray-300" : ""
                    )}
                    placeholder="Nombre de usuario (mínimo 3 caracteres)"
                  />
                  {/* Status indicator */}
                  {usernameChecking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={18} />
                  )}
                  {!usernameChecking && usernameStatus === 'available' && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  )}
                  {!usernameChecking && usernameStatus === 'taken' && (
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                  )}
                </div>
                {/* Feedback message */}
                {usernameStatus === 'available' && (
                  <p className="mt-1 text-xs text-emerald-600">✓ Disponible</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-red-600">✗ Ya está en uso</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, assignedPharmacies: e.target.value === UserRole.SUPERVISOR || e.target.value === UserRole.ADMIN ? formData.assignedPharmacies : [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  {creatableRoles.length === 0 ? (
                    <option value="">No tienes permisos para crear usuarios</option>
                  ) : (
                    creatableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))
                  )}
                </select>
              </div>
              {/* Selector de Farmacias según rol del creador */}
              {currentRole === UserRole.ENCARGADO ? (
                // ENCARGADO: solo puede crear VENDEDOR, mostrar pharmacy asignada como label
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia Asignada</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {getAssignedPharmacyName()}
                  </div>
                  <input type="hidden" name="assignedPharmacies" value={userAssignedPharmacies?.[0] || ''} />
                </div>
              ) : (formData.role === UserRole.SUPERVISOR || formData.role === UserRole.ADMIN) && (
                // ADMIN/SUPERVISOR: mostrar checkboxes para seleccionar farmacias
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Farmacias Asignadas</label>
                  {pharmacies.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay farmacias registradas. Crea primero farmacias en /admin/farmacias.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                      {pharmacies.map((pharmacy: any) => (
                        <label key={pharmacy._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.assignedPharmacies.includes(pharmacy._id)}
                            onChange={(e) => {
                              const code = pharmacy._id
                              if (e.target.checked) {
                                setFormData({ ...formData, assignedPharmacies: [...formData.assignedPharmacies, code] })
                              } else {
                                setFormData({ ...formData, assignedPharmacies: formData.assignedPharmacies.filter(c => c !== code) })
                              }
                            }}
                            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                          />
                          <span className="text-sm">
                            <span className="font-semibold text-gray-900">{pharmacy.pharmacyName}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="+54 11 1234 5678"
                />
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Editar Usuario</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value })
                      if (usernameStatus !== 'idle') {
                        setUsernameStatus('idle')
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.length >= 3 && e.target.value !== selectedUser?.username) {
                        checkUsernameAvailability(e.target.value, selectedUser?._id)
                      }
                    }}
                    className={clsx(
                      "w-full px-3 py-2 pr-10 border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none",
                      usernameStatus === 'available' && "border-emerald-300 bg-emerald-50",
                      usernameStatus === 'taken' && "border-red-300 bg-red-50",
                      !usernameStatus || usernameStatus === 'idle' ? "border-gray-300" : ""
                    )}
                  />
                  {/* Status indicator */}
                  {usernameChecking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={18} />
                  )}
                  {!usernameChecking && usernameStatus === 'available' && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  )}
                  {!usernameChecking && usernameStatus === 'taken' && (
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                  )}
                </div>
                {/* Feedback message */}
                {usernameStatus === 'available' && (
                  <p className="mt-1 text-xs text-emerald-600">✓ Disponible</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="mt-1 text-xs text-red-600">✗ Ya está en uso</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, assignedPharmacies: e.target.value === UserRole.SUPERVISOR || e.target.value === UserRole.ADMIN ? formData.assignedPharmacies : [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  {creatableRoles.length === 0 ? (
                    <option value="">No tienes permisos para crear usuarios</option>
                  ) : (
                    creatableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))
                  )}
                </select>
              </div>
              {/* Selector de Farmacias según rol del creador en edición */}
              {currentRole === UserRole.ENCARGADO ? (
                // ENCARGADO: mostrar pharmacy asignada como label (no editable)
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia Asignada</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {getAssignedPharmacyName()}
                  </div>
                  <input type="hidden" name="assignedPharmacies" value={userAssignedPharmacies?.[0] || ''} />
                </div>
              ) : (formData.role === UserRole.SUPERVISOR || formData.role === UserRole.ADMIN) && (
                // ADMIN/SUPERVISOR: mostrar checkboxes para seleccionar farmacias
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Farmacias Asignadas</label>
                  {pharmacies.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No hay farmacias registradas.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                      {pharmacies.map((pharmacy: any) => (
                        <label key={pharmacy._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.assignedPharmacies.includes(pharmacy._id)}
                            onChange={(e) => {
                              const code = pharmacy._id
                              if (e.target.checked) {
                                setFormData({ ...formData, assignedPharmacies: [...formData.assignedPharmacies, code] })
                              } else {
                                setFormData({ ...formData, assignedPharmacies: formData.assignedPharmacies.filter(c => c !== code) })
                              }
                            }}
                            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                          />
                          <span className="text-sm">
                            <span className="font-semibold text-gray-900">{pharmacy.pharmacyName}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Nueva contraseña para <strong>{selectedUser.name}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-center text-gray-900">Eliminar Usuario</h3>
              <p className="mt-2 text-sm text-center text-gray-500">
                ¿Estás seguro de que deseas eliminar a <strong>{selectedUser.name}</strong>? 
                Esta acción realizará un soft-delete (el usuario quedará inactivo).
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
