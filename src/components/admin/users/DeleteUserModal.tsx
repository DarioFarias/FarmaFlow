'use client'

import { useState } from 'react'
import { IUser } from '@/types'
import { Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DeleteModalProps {
  isOpen: boolean
  user: IUser | null
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: DeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario')
      
      toast.success('Usuario eliminado correctamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-center text-gray-900">Eliminar Usuario</h3>
          <p className="mt-2 text-sm text-center text-gray-500">
            ¿Estás seguro de que deseas eliminar a <strong>{user.name}</strong>? 
            Esta acción realizará un soft-delete (el usuario quedará inactivo).
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
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
  )
}