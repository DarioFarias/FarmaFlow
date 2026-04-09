import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: {
    default: 'FarmaFlow',
    template: '%s | FarmaFlow',
  },
  description:
    'Sistema de gestión centralizada de suministros y gastos para farmacias',
  keywords: ['farmacia', 'gestión', 'suministros', 'gastos', 'supervisor'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
