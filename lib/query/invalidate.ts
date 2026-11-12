// lib/query/invalidate.ts
// Invalidações do React Query agrupadas por evento de negócio, para as telas não precisarem
// conhecer as chaves de cache.

import type { QueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/queryKeys';

/** Funções de invalidação por evento; cada uma recebe o QueryClient. */
export const invalidate = {
  /** Carrinho alterado: recarrega carrinho, resumo e quantidades por item. */
  cart: (qc: QueryClient) => qc.invalidateQueries({ queryKey: qk.cart.all() }),

  /**
   * Compra concluída: recarrega saldo, carrinho, listagens do marketplace e do vendedor e
   * inventário.
   */
  purchase: (qc: QueryClient) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.coins.balance() }),
      qc.invalidateQueries({ queryKey: qk.cart.all() }),
      qc.invalidateQueries({ queryKey: qk.marketplace.all() }),
      qc.invalidateQueries({ queryKey: qk.seller.all() }),
      qc.invalidateQueries({ queryKey: qk.inventory.all() }),
    ]),

  /** Saldo alterado (criação de moldura, compra de moedas). */
  balance: (qc: QueryClient) => qc.invalidateQueries({ queryKey: qk.coins.balance() }),

  /**
   * Inventário alterado (equipar, anunciar, alterar preço, remover anúncio, criar): recarrega
   * inventário e listagens.
   */
  inventory: (qc: QueryClient) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.inventory.all() }),
      qc.invalidateQueries({ queryKey: qk.marketplace.all() }),
      qc.invalidateQueries({ queryKey: qk.seller.all() }),
    ]),

  /** Perfil do usuário logado alterado (ex.: moldura equipada). */
  me: (qc: QueryClient) => qc.invalidateQueries({ queryKey: qk.me() }),
};
