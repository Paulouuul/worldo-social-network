// hooks/queries/useCatalog.ts
// Pacotes e configurações da plataforma.
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fetchJson } from '@/lib/fetcher';
import { cachePolicy, qk } from '@/lib/query-keys';

/** Percentual de taxa da plataforma. Configuração que raramente muda: cache de 1h. */
export function usePlatformFee() {
  return useQuery({
    queryKey: qk.cosmetics.platformFee(),
    queryFn: async ({ signal }) => {
      const data = await fetchJson<{ platform_fee: number }>(
        '/api/worldo/cosmetics/listings/platform_fee',
        { signal },
      );
      return data.platform_fee;
    },
    ...cachePolicy.static,
  });
}

/** Pacotes de moedas: exibem preço cobrado em seguida, por isso sem cache. */
export function useCoinPackages<T>() {
  const { status } = useSession();
  return useQuery({
    queryKey: qk.coins.packages(),
    queryFn: ({ signal }) => fetchJson<T[]>('/api/worldo/coins/packages', { signal }),
    enabled: status === 'authenticated',
    ...cachePolicy.critical,
  });
}

/** Pacotes de criação por raridade: exibem custo cobrado em seguida, por isso sem cache. */
export function useCreationPackages<T>(rarity: string) {
  return useQuery({
    queryKey: qk.cosmetics.creationPackages(rarity),
    queryFn: ({ signal }) =>
      fetchJson<T[]>(
        `/api/worldo/cosmetics/creation/packages?rarity=${encodeURIComponent(rarity)}`,
        { signal },
      ),
    enabled: !!rarity,
    ...cachePolicy.critical,
  });
}
