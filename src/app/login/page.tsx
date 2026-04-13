import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { 
  title: 'Iniciar sesión',
  description: 'Accede al panel de control de FarmaFlow'
}

function LoginFormFallback() {
  return (
    <div className="card shadow-xl border-t-4 border-brand-500">
      <div className="animate-pulse space-y-5">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 mt-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded mt-6"></div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-6 transform transition-transform hover:rotate-12">
            <span className="text-4xl filter drop-shadow-md">💊</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
            FarmaFlow
          </h1>
          <div className="h-1 w-12 bg-emerald-400 mx-auto mt-2 rounded-full"></div>
          <p className="text-brand-100 mt-4 text-sm font-medium opacity-90">
            Sistema de Gestión Farmacéutica Integral
          </p>
        </div>

        {/* Client Side Login Form */}
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        {/* Footer Support */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            ¿Olvidaste tu contraseña o tienes problemas?
          </p>
          <a 
            href="mailto:soporte@farmaflow.com" 
            className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold underline underline-offset-4 decoration-emerald-500/30 transition-colors"
          >
            Contactar al Soporte Técnico
          </a>
        </div>
      </div>
    </div>
  )
}
