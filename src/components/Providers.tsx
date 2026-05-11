'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// =============================================
// Providers: envuelve la app con contextos globales
// SessionProvider (NextAuth) + Toaster (notificaciones) + React Query
// =============================================
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds default
            retry: 2,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#26967c', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
