import { Metadata } from 'next'
import { ProfileForm } from './ProfileForm'

export const metadata: Metadata = {
  title: 'Mi Perfil | FarmaFlow',
  description: 'Gestiona tu información personal y seguridad de tu cuenta.',
}

export default function PerfilPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
        <p className="text-gray-500 mt-2 text-base">
          Actualiza tu foto, información personal y gestiona la seguridad de tu cuenta.
        </p>
      </div>

      <ProfileForm />
    </div>
  )
}
