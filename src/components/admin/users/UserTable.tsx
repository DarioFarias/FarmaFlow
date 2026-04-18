'use client'

import { IUser, UserRole } from '@/types'
import { 
  ToggleLeft, ToggleRight, 
  Pencil, Key, Trash2, Loader2 
} from 'lucide-react'
import clsx from 'clsx'

interface UserTableProps {
  users: IUser[]
  currentUserId?: string
  actionId: string | null
  onToggleActive: (userId: string, currentStatus: boolean) => void
  onEdit: (user: IUser) => void
  onPassword: (user: IUser) => void
  onDelete: (user: IUser) => void
}

export default function UserTable({
  users,
  currentUserId,
  actionId,
  onToggleActive,
  onEdit,
  onPassword,
  onDelete,
}: UserTableProps) {
  const canDeleteUser = (user: IUser, allUsers: IUser[]) => {
    if (user.role === 'SUPER_ADMIN' && user._id === currentUserId) return false
    if (user.role === 'SUPER_ADMIN' && allUsers.filter(u => u.role === 'SUPER_ADMIN' && u.isActive).length <= 1) return false
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
                onClick={() => onEdit(u)}
                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Editar usuario"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => onPassword(u)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Cambiar contraseña"
              >
                <Key size={18} />
              </button>
              <button 
                onClick={() => onDelete(u)}
                disabled={!canDeleteUser(u, users)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:hover:bg-transparent disabled:text-gray-200 disabled:cursor-not-allowed"
                title={
                  !canDeleteUser(u, users)
                    ? u.role === 'SUPER_ADMIN' && u._id === currentUserId
                      ? 'No puedes eliminar tu propia cuenta'
                      : 'No puedes eliminar al último Super Admin'
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