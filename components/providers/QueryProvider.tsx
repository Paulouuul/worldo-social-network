// components/providers/QueryProvider.tsx
// Provider do React Query: cria o QueryClient com os padrões do app, limpa o cache na troca de
// usuário e inclui o React Query Devtools.
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

/** Limpa todo o cache quando o usuário da sessão muda (logout ou login com outra conta). */
function ClearCacheOnUserChange({ client }: { client: QueryClient }) {
  const { data: session, status } = useSession();
  const userId = status === 'loading' ? undefined : (session?.user?.id ?? null);
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (userId === undefined) return;
    if (previous.current !== undefined && previous.current !== userId) {
      client.clear();
    }
    previous.current = userId;
  }, [userId, client]);

  return null;
}

/**
 * QueryClientProvider com padrões: staleTime 30s, gcTime 5min, 1 retentativa e revalidação ao
 * focar.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ClearCacheOnUserChange client={client} />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
