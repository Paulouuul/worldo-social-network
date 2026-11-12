// hooks/queries/useWallet.ts
// Hooks de saldo de moedas e carrinho. São dados críticos: sempre buscados do servidor, sem
// cache.
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { backendJson, fetchJson } from '@/lib/api/fetcher';
import { cachePolicy, qk } from '@/lib/query/queryKeys';

/** Totais do carrinho retornados pelo backend. */
export interface CartSummary {
  total_items: number;
  total_price: number;
  unique_items_count: number;
}

/** Saldo de moedas do usuário, revalidado a cada 30s com a aba visível e ao focar a janela. */
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
    // O Header mantém a query observada, então o polling roda em todas as páginas
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Resumo do carrinho (backend Python), revalidado a cada 30s com a aba visível e ao focar a
 * janela.
 */
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

/** Carrinho completo com preço e estoque atuais. `enabled: false` congela o último valor. */
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
