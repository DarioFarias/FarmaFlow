'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, Lock, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfileForm() {
  const { data: session, update } = useSession()
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      phone: (session?.user as any)?.phone || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Error al actualizar el perfil')
      
      await update() // Actualizar sesión de NextAuth
      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      toast.error('Hubo un error al guardar los cambios')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onUpdatePassword = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al cambiar contraseña')

      toast.success('Contraseña cambiada con éxito')
      passwordForm.reset()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      // 1. Aquí iría la lógica de compresión con Canvas (omitido por brevedad para el MVP técnico inicial)
      // 2. Subida a Cloudinary...
      
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error al subir la imagen')

      await update()
      toast.success('Foto de perfil actualizada')
    } catch (error) {
      toast.error('Error al subir la imagen')
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Sección Perfil e Imagen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-brand-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                {(session?.user as any)?.profileImage ? (
                  <img src={(session?.user as any).profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <User size={48} className="text-brand-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-brand-700 transition-all hover:scale-110">
                {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
              </label>
            </div>
            <h3 className="mt-4 font-bold text-gray-900">{session?.user?.name}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">{(session?.user as any)?.role}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-brand-500" />
              Datos Personales
            </h3>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  <input 
                    {...profileForm.register('name')} 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 ring-brand-500 outline-none transition-all"
                  />
                  {profileForm.formState.errors.name && <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                  <input 
                    {...profileForm.register('phone')}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="btn-primary min-w-[120px]"
                >
                  {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sección Seguridad */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lock size={20} className="text-rose-500" />
          Seguridad
        </h3>
        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña Actual</label>
            <input 
              type="password"
              {...passwordForm.register('currentPassword')}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 ring-rose-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nueva Contraseña</label>
              <input 
                type="password"
                {...passwordForm.register('newPassword')}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 ring-rose-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Nueva Contraseña</label>
              <input 
                type="password"
                {...passwordForm.register('confirmPassword')}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 ring-rose-500 outline-none transition-all"
              />
            </div>
          </div>
          {passwordForm.formState.errors.newPassword && <p className="text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>}
          {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>}
          
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isUpdatingPassword}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center min-w-[150px]"
            >
              {isUpdatingPassword ? <Loader2 size={18} className="animate-spin" /> : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
