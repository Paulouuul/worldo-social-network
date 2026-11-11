// components/MainWrapper.tsx
// Container <main> do app.
'use client';

import { useSession } from 'next-auth/react';
/**
 * Envolve o conteúdo da página, com espaço superior para o Header fixo quando há sessão
 * autenticada.
 */
export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <main
      className={`min-h-screen ${isAuthenticated ? 'pt-16 md:pt-20' : ''}`}
      suppressHydrationWarning
    >
      {children}
    </main>
  );
}
