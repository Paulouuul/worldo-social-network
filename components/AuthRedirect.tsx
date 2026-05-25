// components/AuthRedirect.tsx
'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AuthRedirect() {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  
  useEffect(() => {
    // Se está autenticado e está na raiz, redireciona
    if (status === 'authenticated' && pathname === '/') {
      router.push('/worldo')
    }

    if (status === 'unauthenticated' && pathname.startsWith('/worldo')) {
      router.push('/login')
    }
  }, [status, pathname, router])
  
  return null
}