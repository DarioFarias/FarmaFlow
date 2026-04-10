'use client'

import { useEffect, useState } from 'react'
import { Users, Shield, UserCog, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { UserRole, IUser } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios')
      
      // Asegurar que setUsers siempre reciba un array
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        throw new Error('Formato de datos incorrecto')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar usuarios')
      setUsers([]) // fallback seguro para evitar crasheos de .map
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Shield className="text-brand-600" size={24} />
          Panel de Control Maestra
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Gestión centralizada de roles, permisos y estados de cuenta.</p>
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
            {users.map((u) => (
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
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {u.pharmacyName || u.pharmacyCode || '---'}
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
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleToggleActive(u._id, u.isActive)}
                      className={clsx(
                        "p-1.5 rounded-lg transition-colors",
                        u.isActive ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"
                      )}
                      title={u.isActive ? "Desactivar" : "Activar"}
                    >
                      {u.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Configuración Avanzada"
                    >
                      <UserCog size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
