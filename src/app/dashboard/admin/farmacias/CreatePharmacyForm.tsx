'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export function CreatePharmacyForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'PHARMACY',
    },
  })

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la farmacia')
      }

      toast.success('¡Farmacia creada con éxito!')
      router.push('/dashboard/admin/farmacias')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/admin/farmacias"
          className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Volver al listado
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            <div className="col-span-full pb-2 border-b border-gray-50 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Datos de la Sucursal</h3>
              <p className="text-sm text-gray-500">Información pública de la farmacia en el sistema.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="pharmacyName" className="label font-medium">Nombre de la Sucursal</label>
              <input
                {...register('pharmacyName')}
                id="pharmacyName"
                placeholder="Ej: Farmacia Centro"
                className={`input ${errors.pharmacyName ? 'border-red-500' : ''}`}
              />
              {errors.pharmacyName && <p className="text-xs text-red-500">{errors.pharmacyName.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="pharmacyCode" className="label font-medium">Código Interno</label>
              <input
                {...register('pharmacyCode')}
                id="pharmacyCode"
                placeholder="FAR-001"
                className={`input ${errors.pharmacyCode ? 'border-red-500' : ''}`}
              />
              {errors.pharmacyCode && <p className="text-xs text-red-500">{errors.pharmacyCode.message}</p>}
            </div>

            <div className="col-span-full pb-2 border-b border-gray-50 mb-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900">Acceso y Responsable</h3>
              <p className="text-sm text-gray-500">Credenciales para que la farmacia inicie sesión.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="label font-medium">Nombre del Responsable</label>
              <input
                {...register('name')}
                id="name"
                placeholder="Ej: Juan Pérez"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="label font-medium">Email de Acceso</label>
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="sucursal01@farmacia.com"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" id="password_label" className="label font-medium">Contraseña Inicial</label>
              <input
                {...register('password')}
                id="password"
                type="password"
                placeholder="••••••••"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="label font-medium">Teléfono (Opcional)</label>
              <input
                {...register('phone')}
                id="phone"
                placeholder="+54 9 11 ..."
                className="input"
              />
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-50 flex justify-end gap-4">
            <Link 
              href="/dashboard/admin/farmacias"
              className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Crear Farmacia
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
