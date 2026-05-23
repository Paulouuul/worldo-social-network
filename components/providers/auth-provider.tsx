// components/providers/auth-provider.tsx
'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'

function SessionForceSync() {
  const { update } = useSession()
  
  useEffect(() => {
    // 🔥 A MAGIA ACONTECE AQUI
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Página restaurada do cache, forçando sync...')
        await update() // ← Isso resolve tudo!
      }
    }
    
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [update])
  
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={true}
      refetchInterval={60}
    >
      <SessionForceSync />
      {children}
    </SessionProvider>
  )
}