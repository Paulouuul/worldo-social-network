// constants/routes.ts
// Rotas de página do app. Links, redirecionamentos e o proxy usam estes valores em vez de escrever
// os caminhos à mão.

export const ROUTES = {
  /** Raiz do site (o proxy redireciona para login ou para a home). */
  root: '/',
  login: '/login',
  register: '/register',

  /** Home do usuário logado. */
  home: '/worldo',
  explore: '/worldo/explore',

  /** Perfil do usuário logado (redireciona para o perfil público). */
  profile: '/worldo/perfil',
  profileEdit: '/worldo/perfil/edit',
  /** Perfil público por publicId ou username. */
  profileOf: (identifier: string) => `/worldo/perfil/${identifier}`,

  coins: '/worldo/coins',

  marketplace: '/worldo/cosmetics/marketplace',
  /** Detalhe de um anúncio do marketplace. */
  listing: (listingId: string) => `/worldo/cosmetics/marketplace/${listingId}`,
  cart: '/worldo/cosmetics/marketplace/cart',
  checkout: '/worldo/cosmetics/marketplace/checkout',
  /** Loja de um vendedor por publicId ou username. */
  seller: (identifier: string) => `/worldo/cosmetics/seller/${identifier}`,
  /** Detalhe de uma moldura. */
  cosmetic: (frameId: string) => `/worldo/cosmetics/${frameId}`,
  inventory: '/worldo/cosmetics/inventory',
  createCosmetic: '/worldo/cosmetics/create',
} as const;
