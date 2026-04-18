'use client'

import { useState, useMemo } from 'react'
import { UserRole, IPharmacy } from '@/types'
import { X, Loader2, Check } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import PharmacyCheckboxGroup from './PharmacyCheckboxGroup'
import { getPharmacyAssignmentType, PharmacyAssignmentType } from '@/lib/roles'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

interface UserFormData {
  name: string
  username: string
  email: string
  password: string
  role: UserRole
  phone: string
  assignedPharmacies: string[]
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  creatableRoles: UserRole[]
  currentRole: UserRole | undefined
  userAssignedPharmacies: string[] | undefined
  pharmacies: IPharmacy[]
  onSuccess: () => void
}

const initialFormData: UserFormData = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: UserRole.SUPERVISOR,
  phone: '',
  assignedPharmacies: [],
}

export default function CreateUserModal({
  isOpen,
  onClose,
  creatableRoles,
  currentRole,
  userAssignedPharmacies,
  pharmacies,
  onSuccess,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameChecking, setUsernameChecking] = useState(false)

  // Determinar el tipo de asignación de farmacias según el rol seleccionado
  const assignmentType = useMemo(() => 
    getPharmacyAssignmentType(formData.role), 
    [formData.role]
  )

  // Determinar si el usuario actual (creador) es ENCARGADO
  const isCreatorEncargado = currentRole === UserRole.ENCARGADO
  
  // Determinar si el creador (ENCARGADO) tiene farmacia asignada
  const creatorHasPharmacy = userAssignedPharmacies && userAssignedPharmacies.length > 0

  // Determinar si se puede seleccionar rol VENDEDOR
  // Solo si el creador NO es ENCARGADO, o si es ENCARGADO pero tiene farmacia
  const canSelectVendorRole = !isCreatorEncargado || creatorHasPharmacy

  const getAssignedPharmacyName = () => {
    if (!userAssignedPharmacies || userAssignedPharmacies.length === 0) return 'Sin asignar'
    const pharmacy = pharmacies.find(p => p._id === userAssignedPharmacies[0])
    return pharmacy?.pharmacyName || userAssignedPharmacies[0]
  }

  const checkUsernameAvailability = async (username: string) => {
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
      
      setUsernameStatus(data.available ? 'available' : 'taken')
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameStatus('error')
    } finally {
      setUsernameChecking(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setShowPassword(false)
    setFormError(null)
    setUsernameStatus('idle')
    setUsernameChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

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
      resetForm()
      onSuccess()
      onClose()
    } catch (error: any) {
      setFormError(error.message || 'Error al crear usuario')
      toast.error(error.message || 'Error al crear usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
          <button onClick={() => { resetForm(); onClose() }} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  if (usernameStatus !== 'idle') setUsernameStatus('idle')
                }}
                onBlur={(e) => {
                  if (e.target.value.length >= 3) checkUsernameAvailability(e.target.value)
                }}
                className={clsx(
                  "w-full px-3 py-2 pr-10 border rounded-lg focus:ring-1 focus:ring-brand-500 outline-none",
                  usernameStatus === 'available' && "border-emerald-300 bg-emerald-50",
                  usernameStatus === 'taken' && "border-red-300 bg-red-50",
                  !usernameStatus || usernameStatus === 'idle' ? "border-gray-300" : ""
                )}
                placeholder="Nombre de usuario (mínimo 3 caracteres)"
              />
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
                {showPassword ? <X size={18} /> : <X size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole
                const newAssignmentType = getPharmacyAssignmentType(newRole)
                
                // Si el nuevo rol no permite farmacias, limpiar la selección
                let newPharmacies = formData.assignedPharmacies
                if (newAssignmentType === 'none') {
                  newPharmacies = []
                } else if (newAssignmentType === 'single' && formData.assignedPharmacies.length > 1) {
                  newPharmacies = [formData.assignedPharmacies[0]]
                }
                
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  assignedPharmacies: newPharmacies
                })
              }}
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
          {/* Campo de asignación de farmacias según el tipo */}
          {assignmentType === 'multiple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Farmacias Asignadas</label>
              <PharmacyCheckboxGroup
                pharmacies={pharmacies}
                selected={formData.assignedPharmacies}
                onChange={(selected) => setFormData({ ...formData, assignedPharmacies: selected })}
              />
            </div>
          )}
          {assignmentType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.role === UserRole.VENDEDOR && isCreatorEncargado 
                  ? 'Farmacia Asignada (solo puedes asignar tu misma farmacia)' 
                  : 'Farmacia Asignada'}
              </label>
              {formData.role === UserRole.VENDEDOR && isCreatorEncargado ? (
                // VENDEDOR creado por ENCARGADO: solo puede ver su propia farmacia (readonly)
                <>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {getAssignedPharmacyName()}
                  </div>
                  <input type="hidden" name="assignedPharmacies" value={userAssignedPharmacies?.[0] || ''} />
                </>
              ) : (
                // ENCARGADO o VENDEDOR creado por SUPERVISOR/SUPER_ADMIN: dropdown para seleccionar
                <select
                  value={formData.assignedPharmacies[0] || ''}
                  onChange={(e) => setFormData({ ...formData, assignedPharmacies: e.target.value ? [e.target.value] : [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="">Seleccionar farmacia</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy._id} value={pharmacy._id}>
                      {pharmacy.pharmacyName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          {/* assignmentType === 'none' no muestra nada (ADMIN/SUPER_ADMIN) */}
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
              onClick={() => { resetForm(); onClose() }}
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
  )
}