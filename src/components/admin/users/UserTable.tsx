'use client'

import { IUser, UserRole } from '@/types'
import { 
  ToggleLeft, ToggleRight, 
  Pencil, Key, Trash2, Loader2 
} from 'lucide-react'
import clsx from 'clsx'
import { canEditUser, isSupervisor } from '@/lib/roles'

interface UserTableProps {
  users: IUser[]
  currentUserId?: string
  currentUserRole?: UserRole
  currentUserAssignedPharmacies?: string[]
  actionId: string | null
  onToggleActive: (userId: string, currentStatus: boolean) => void
  onEdit: (user: IUser) => void
  onPassword: (user: IUser) => void
  onDelete: (user: IUser) => void
}

export default function UserTable({
  users,
  currentUserId,
  currentUserRole,
  currentUserAssignedPharmacies,
  actionId,
  onToggleActive,
  onEdit,
  onPassword,
  onDelete,
}: UserTableProps) {
  // Verificar si el usuario actual puede gestionar la pharmacy del usuario objetivo
  // Para SUPERVISOR: solo puede gestionar usuarios que tengan al menos una pharmacy en común
  const canManageUserPharmacy = (targetUser: IUser): boolean => {
    // Si no es supervisor, puede gestionar cualquiera de nivel inferior
    if (!isSupervisor(currentUserRole)) return true
    
    // Si es supervisor pero no tiene farmacias asignadas, no puede gestionar nadie
    if (!currentUserAssignedPharmacies || currentUserAssignedPharmacies.length === 0) return false
    
    // Verificar si el usuario objetivo tiene al menos una pharmacy en común
    const targetPharmacies = targetUser.assignedPharmacies || []
    const hasCommonPharmacy = targetPharmacies.some(p => currentUserAssignedPharmacies.includes(p))
    return hasCommonPharmacy
  }

  const canDeleteUser = (user: IUser, allUsers: IUser[]) => {
    // No puede eliminarse a sí mismo
    if (user._id === currentUserId) return false
    // No puede eliminar SUPER_ADMIN ni ADMIN
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return false
    // Verificar jerarquía: solo puede eliminar usuarios de nivel inferior
    if (!canEditUser(currentUserRole, user.role as UserRole)) return false
    // Verificar pharmacy en común (para SUPERVISOR)
    if (!canManageUserPharmacy(user)) return false
    return true
  }

  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="py-12 text-center text-gray-400 text-sm italic">
          No hay usuarios registrados. ¡Crea el primero!
        </td>
      </tr>
    )
  }

  return (
    <>
      {users.map((u) => (
        <tr key={u._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20 transition-colors">
          <td className="py-4 px-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{u.name}</span>
              <span className="text-xs text-gray-500">{u.email}</span>
            </div>
          </td>
          <td className="py-4 px-4">
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg px-2 py-1">
              {u.role}
            </span>
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
                onClick={() => onToggleActive(u._id, u.isActive)}
                disabled={actionId === u._id || !canEditUser(currentUserRole, u.role as UserRole)}
                className={clsx(
                  "p-1.5 rounded-lg transition-colors",
                  u.isActive ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50",
                  (!canEditUser(currentUserRole, u.role as UserRole) || actionId === u._id) && "disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                )}
                title={!canEditUser(currentUserRole, u.role as UserRole) || !canManageUserPharmacy(u) ? "No puedes gestionar usuarios de otras farmacias" : u.isActive ? "Desactivar" : "Activar"}
              >
                {u.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
              <button 
                onClick={() => onEdit(u)}
                disabled={!canEditUser(currentUserRole, u.role as UserRole) || !canManageUserPharmacy(u)}
                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                title={!canEditUser(currentUserRole, u.role as UserRole) || !canManageUserPharmacy(u) ? "No puedes gestionar usuarios de otras farmacias" : "Editar usuario"}
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => onPassword(u)}
                disabled={!canEditUser(currentUserRole, u.role as UserRole) || !canManageUserPharmacy(u)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                title={!canEditUser(currentUserRole, u.role as UserRole) || !canManageUserPharmacy(u) ? "No puedes gestionar usuarios de otras farmacias" : "Cambiar contraseña"}
              >
                <Key size={18} />
              </button>
              <button 
                onClick={() => onDelete(u)}
                disabled={!canDeleteUser(u, users)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                title={
                  !canDeleteUser(u, users)
                    ? u._id === currentUserId
                      ? 'No puedes eliminar tu propia cuenta'
                      : u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                        ? 'No puedes eliminar usuarios de nivel superior'
                        : !canManageUserPharmacy(u)
                          ? 'No puedes gestionar usuarios de otras farmacias'
                          : 'No tienes permisos para eliminar este usuario'
                    : 'Eliminar usuario'
                }
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}