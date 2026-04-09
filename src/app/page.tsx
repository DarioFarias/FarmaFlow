import { redirect } from 'next/navigation'

// Redirige la raíz "/" al dashboard (o login si no hay sesión, 
// el middleware se encargará de eso)
export default function HomePage() {
  redirect('/dashboard')
}
