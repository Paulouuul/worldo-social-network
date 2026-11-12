// lib/query/queryKeys.ts
// Chaves e políticas de cache do React Query. Toda query e invalidação usa estas funções.

/** Filtros das listagens do marketplace e da loja do vendedor. */
export interface ListingFilters {
  rarity: string;
  sort: string;
  search: string;
}

/** Filtros do inventário (inclui situação: all, listed, unlisted). */
export interface InventoryFilters extends ListingFilters {
  filter: string;
}

/**
 * Fábrica de chaves de query, organizada por domínio. Prefixos como ['cart'] invalidam o grupo
 * todo.
 */
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
    stats: (filters: { search: string; rarity: string }) =>
      ['inventory', 'stats', filters] as const,
  },
};

/** Políticas de cache por tipo de dado. */
export const cachePolicy = {
  /**
   * Preço, estoque, saldo e carrinho: sempre buscados do servidor e descartados sem
   * observadores.
   */
  critical: { staleTime: 0, gcTime: 0, refetchOnMount: 'always' as const },
  /**
   * Páginas de listagem com preço: revalidadas a cada montagem e liberadas da memória 30s após
   * sair da tela.
   */
  livePages: { staleTime: 0, gcTime: 30_000, refetchOnMount: 'always' as const },
  /**
   * Inventário do próprio usuário: invalidado a cada ação; páginas liberadas 30s após sair da
   * tela.
   */
  inventory: { staleTime: 30_000, gcTime: 30_000 },
  /** Configurações que raramente mudam (ex.: taxa da plataforma): 1h. */
  static: { staleTime: 60 * 60_000, gcTime: 60 * 60_000 },
  /** Perfis públicos: 5 min. */
  profile: { staleTime: 5 * 60_000, gcTime: 10 * 60_000 },
  /** Dados descritivos de molduras: 10 min. */
  frame: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
};
