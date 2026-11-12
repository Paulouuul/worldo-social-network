// constants/marketplace.ts
// Regras do marketplace compartilhadas entre telas e rotas de API.

/** Preço máximo (moedas por unidade) e quantidade máxima de um anúncio. */
export const LISTING_MAX_PRICE = 1_000_000;
export const LISTING_MAX_QUANTITY = 1_000_000;

/** Taxa da plataforma (%) usada quando não há taxa ativa cadastrada. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 5;

/**
 * Máximo de unidades de um mesmo anúncio no carrinho. Igual a
 * RedisCartService.MAX_QUANTITY_PER_ITEM no backend Python.
 */
export const CART_MAX_QUANTITY_PER_ITEM = 99;

/** Itens buscados por página nas grades de catálogo (marketplace, vendedor e inventário). */
export const CATALOG_PAGE_SIZE = 56;

/** Ordenações aceitas pelas listagens (parâmetro `sort` das APIs). */
export const SORT = {
  newest: 'newest',
  oldest: 'oldest',
  priceAsc: 'price_asc',
  priceDesc: 'price_desc',
} as const;
