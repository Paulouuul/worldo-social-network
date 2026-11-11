// hooks/queries/useWallet.ts
// Saldo de moedas e resumo do carrinho: dados críticos, sem cache.
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { backendJson, fetchJson } from '@/lib/fetcher';
import { cachePolicy, qk } from '@/lib/query-keys';

export interface CartSummary {
  total_items: number;
  total_price: number;
  unique_items_count: number;
}

export function useCoinBalance() {
  const { status } = useSession();

  return useQuery({
    queryKey: qk.coins.balance(),
    queryFn: async ({ signal }) => {
      const data = await fetchJson<{ balance?: number }>('/api/worldo/coins/balance', { signal });
      return data.balance ?? 0;
    },
    enabled: status === 'authenticated',
    ...cachePolicy.critical,
    // Observado pelo Header o tempo todo; gcTime 0 só vale quando não há observadores.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useCartSummary() {
  const { status } = useSession();

  return useQuery({
    queryKey: qk.cart.summary(),
    queryFn: async ({ signal }) => {
      const data = await backendJson<Partial<CartSummary>>(
        '/cosmetics/marketplace/cart/get/summary',
        { method: 'GET', signal },
      );
      return {
        total_items: data.total_items || 0,
        total_price: data.total_price || 0,
        unique_items_count: data.unique_items_count || 0,
      } satisfies CartSummary;
    },
    enabled: status === 'authenticated',
    ...cachePolicy.critical,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/** Carrinho completo (preços/estoque): sempre buscado do servidor, sem cache. */
export function useCartDetail<T>({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.cart.detail(),
    queryFn: async ({ signal }) => {
      const data = await backendJson<{ data: T | null }>('/cosmetics/marketplace/cart/get', {
        method: 'GET',
        signal,
      });
      return data.data;
    },
    enabled,
    ...cachePolicy.critical,
  });
}
