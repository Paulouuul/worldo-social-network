// lib/query-keys.ts
// Chaves centralizadas do React Query. Toda query/invalidação deve usar estas funções.

export interface ListingFilters {
  rarity: string;
  sort: string;
  search: string;
}

export interface InventoryFilters extends ListingFilters {
  filter: string;
}

export const qk = {
  me: () => ['me'] as const,
  user: (identifier: string) => ['user', identifier] as const,

  coins: {
    balance: () => ['coins', 'balance'] as const,
    packages: () => ['coins', 'packages'] as const,
  },

  cart: {
    all: () => ['cart'] as const,
    summary: () => ['cart', 'summary'] as const,
    detail: () => ['cart', 'detail'] as const,
    item: (listingId: string) => ['cart', 'item', listingId] as const,
  },

  cosmetics: {
    frame: (frameId: string) => ['cosmetics', 'frame', frameId] as const,
    creationPackages: (rarity: string) => ['cosmetics', 'creation-packages', rarity] as const,
    platformFee: () => ['cosmetics', 'platform-fee'] as const,
  },

  marketplace: {
    all: () => ['marketplace'] as const,
    list: (filters: ListingFilters) => ['marketplace', 'list', filters] as const,
    listing: (listingId: string) => ['marketplace', 'listing', listingId] as const,
  },

  seller: {
    all: () => ['seller'] as const,
    list: (identifier: string, filters: ListingFilters) =>
      ['seller', identifier, 'list', filters] as const,
  },

  inventory: {
    all: () => ['inventory'] as const,
    list: (filters: InventoryFilters) => ['inventory', 'list', filters] as const,
    stats: () => ['inventory', 'stats'] as const,
  },
};

/**
 * Políticas de cache.
 * CRITICAL: preço/estoque/saldo/carrinho — nunca reaproveitados de cache.
 */
export const cachePolicy = {
  critical: { staleTime: 0, gcTime: 0, refetchOnMount: 'always' as const },
  /** Páginas de listagem com preço: revalidadas sempre, liberadas da memória 30s após sair da tela. */
  livePages: { staleTime: 0, gcTime: 30_000, refetchOnMount: 'always' as const },
  /** Inventário do próprio usuário: invalidado a cada ação; páginas liberadas 30s após sair da tela. */
  inventory: { staleTime: 30_000, gcTime: 30_000 },
  static: { staleTime: 60 * 60_000, gcTime: 60 * 60_000 },
  profile: { staleTime: 5 * 60_000, gcTime: 10 * 60_000 },
  frame: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
};
