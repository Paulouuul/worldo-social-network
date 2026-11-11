// lib/invalidate.ts
// Invalidações agrupadas por evento de negócio, para não espalhar chaves pelas telas.
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';

export const invalidate = {
  /** Carrinho alterado (adicionar, remover, alterar quantidade, limpar). */
  cart: (qc: QueryClient) => qc.invalidateQueries({ queryKey: qk.cart.all() }),

  /** Compra concluída: saldo, carrinho, estoque das listagens e inventário mudam. */
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

  /** Inventário alterado (equipar, anunciar, alterar preço, remover anúncio, criar). */
  inventory: (qc: QueryClient) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.inventory.all() }),
      qc.invalidateQueries({ queryKey: qk.marketplace.all() }),
      qc.invalidateQueries({ queryKey: qk.seller.all() }),
    ]),

  /** Perfil do usuário logado alterado (moldura equipada etc.). */
  me: (qc: QueryClient) => qc.invalidateQueries({ queryKey: qk.me() }),
};
