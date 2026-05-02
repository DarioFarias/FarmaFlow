'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<void>
  isLoading?: boolean
  title: string
  message: string
}

// Cache de 5 minutos (300000ms)
const CACHE_DURATION = 300000

export default function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
}: AdminConfirmModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache: timestamp de la última verificación exitosa
  const [lastVerified, setLastVerified] = useState<number | null>(null)

  // Verificar si el cache está vigente
  const isCacheValid = useCallback(() => {
    if (!lastVerified) return false
    return Date.now() - lastVerified < CACHE_DURATION
  }, [lastVerified])

  // Resetear el estado al abrir
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setShowPassword(false)
      setError(null)
    }
  }, [isOpen])

  // Cerrar también resetea el estado
  const handleClose = () => {
    setPassword('')
    setShowPassword(false)
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Si el cache está vigente, omitir la verificación de contraseña
    if (isCacheValid()) {
      try {
        await onConfirm('')
      } catch {
        // onConfirm maneja sus propios errores
      }
      return
    }

    if (!password) {
      setError('La contraseña es requerida')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al verificar la contraseña')
        return
      }

      if (!data.valid) {
        setError('Contraseña incorrecta')
        return
      }

      // Cachear la verificación exitosa
      setLastVerified(Date.now())
      
      // Llamar onConfirm con contraseña vacía (ya verificada)
      await onConfirm(password)
    } catch (err) {
      setError('Error al verificar la contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting || isLoading}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-600">{message}</p>

          {/* Mostrar indicador de cache válido */}
          {isCacheValid() && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs">
              ✓ Sesión verificada reciente (válido por 5 minutos)
            </div>
          )}

          {/* Input de contraseña (solo si no hay cache válido) */}
          {!isCacheValid() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirma tu contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="Tu contraseña actual"
                  disabled={isSubmitting || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting || isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(isSubmitting || isLoading) && <Loader2 className="animate-spin" size={18} />}
              {isCacheValid() ? 'Confirmar' : 'Verificar y Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}