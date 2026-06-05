'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
