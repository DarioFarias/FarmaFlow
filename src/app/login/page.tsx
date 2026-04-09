import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FarmaFlow</h1>
          <p className="text-brand-100 mt-1 text-sm">Gestión centralizada de farmacias</p>
        </div>

        {/* Card form */}
        <div className="card shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
          <form action="/api/auth/callback/credentials" method="POST" className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@farmacia.com"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2">
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-brand-100 text-xs mt-6">
          ¿Problemas para ingresar? Contacta al supervisor.
        </p>
      </div>
    </div>
  )
}
