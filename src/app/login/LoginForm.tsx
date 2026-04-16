'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        username: data.username.toLowerCase(),
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        // Error de NextAuth: CredentialsSignin indica credenciales inválidas
        if (result.error === 'CredentialsSignin') {
          toast.error('Credenciales incorrectas. Verifica tu usuario y contraseña.')
        } else {
          toast.error('Error al iniciar sesión. Intenta de nuevo.')
        }
      } else {
        toast.success('¡Bienvenido a FarmaFlow!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card shadow-xl border-t-4 border-brand-500">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Acceder al sistema</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="username" className="label text-gray-700 font-medium">
            Nombre de usuario
          </label>
          <input
            {...register('username')}
            id="username"
            type="text"
            placeholder="usuario123"
            disabled={isLoading}
            className={`input ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500 italic">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" id="password_id" className="label text-gray-700 font-medium">
            Contraseña
          </label>
          <div className="relative">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              disabled={isLoading}
              className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 italic">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Iniciando sesión...
            </>
          ) : (
            'Entrar ahora'
          )}
        </button>
      </form>
    </div>
  )
}
