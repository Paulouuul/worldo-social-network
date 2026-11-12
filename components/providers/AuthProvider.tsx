// components/providers/AuthProvider.tsx
// Provider de sessão do NextAuth para o app, com revalidação ao focar a janela e ao voltar do
// cache de navegação (bfcache).
'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';

/** Revalida a sessão quando a página é restaurada do bfcache (voltar/avançar do navegador). */
function SessionForceSync() {
  const { update } = useSession();

  useEffect(() => {
    // Página restaurada do bfcache: revalida a sessão
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('Página restaurada do cache, forçando sync...');
        await update();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [update]);

  return null;
}

/** SessionProvider do NextAuth com revalidação da sessão ao focar a janela. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <SessionForceSync />
      {children}
    </SessionProvider>
  );
}
