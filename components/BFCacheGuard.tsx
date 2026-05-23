// components/BFCacheGuard.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function BFCacheGuard() {
  const pathname = usePathname()
  
  useEffect(() => {
    let isFirstLoad = true
    
    const handlePageShow = (event: PageTransitionEvent) => {
      // Se for página de perfil e veio do bfcache
      if (event.persisted && pathname?.startsWith('/perfil')) {
        console.log('🔄 BFCache detectado, forçando reload...')
        
        // Forçar reload completo
        window.location.reload()
      }
    }
    
    const handleBeforeUnload = () => {
      isFirstLoad = false
    }
    
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])
  
  return null
}