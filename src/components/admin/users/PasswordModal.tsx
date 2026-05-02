'use client'

import { useState } from 'react'
import { IUser } from '@/types'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminConfirmModal from './AdminConfirmModal'

interface PasswordModalProps {
  isOpen: boolean
  user: IUser | null
  onClose: () => void
  onSuccess: () => void
}

export default function PasswordModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: PasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Resetear newPassword al cerrar
  const handleClose = () => {
    setNewPassword('')
    setShowPassword(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // Mostrar modal de confirmación
    setShowConfirmModal(true)
  }

  const handleConfirm = async (password: string) => {
    if (!user) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/users/${user._id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña')
      
      toast.success('Contraseña actualizada correctamente')
      setNewPassword('')
      setShowConfirmModal(false)
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
              Nueva contraseña para <strong>{user.name}</strong> ({user.username})
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
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newPassword}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmación */}
      <AdminConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        isLoading={isSubmitting}
        title="Confirmar cambio de contraseña"
        message={`¿Estás seguro de que deseas cambiar la contraseña de ${user.name}? Esta acción no se puede deshacer.`}
      />
    </>
  )
}