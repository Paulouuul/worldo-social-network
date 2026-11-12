// app/worldo/cosmetics/marketplace/page.tsx
// Página /worldo/cosmetics/marketplace: catálogo de anúncios com busca, filtro de raridade,
// ordenação e grade virtualizada paginada sob demanda.
'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Package, Store } from 'lucide-react';
import {
  CatalogHeader,
  CatalogLayout,
  catalogActionClass,
} from '@/components/cosmetics/catalog/CatalogLayout';
import {
  CatalogFilters,
  LISTING_SORT_OPTIONS,
  SortSelector,
  toRarityParam,
  type RaritySelection,
} from '@/components/cosmetics/catalog/CatalogFilters';
import {
  MarketplaceVirtualized,
  selectListings,
  type ListingsPage,
} from '@/components/cosmetics/marketplace/MarketplaceVirtualized';
import type { PagedSource } from '@/components/ui/dataDisplay/VirtualizedPagedGrid';
import { fetchJson, toQueryString } from '@/lib/api/fetcher';
import { cachePolicy, qk } from '@/lib/query/queryKeys';
import { ROUTES } from '@/constants/routes';
import { CATALOG_PAGE_SIZE, SORT } from '@/constants/marketplace';

/**
 * Catálogo do marketplace. Páginas com preço/estoque são revalidadas sempre e liberadas da
 * memória ao sair da tela.
 */
export default function MarketplacePage() {
  const { data: session, status } = useSession();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RaritySelection>([]);
  const [sort, setSort] = useState<string>(SORT.newest);

  // Fonte paginada da grade, recriada quando os filtros mudam
  const source = useMemo<PagedSource<ListingsPage['listings'][number], ListingsPage>>(() => {
    const filters = { rarity: toRarityParam(rarityFilter), sort, search: searchTerm };
    return {
      baseKey: qk.marketplace.list(filters),
      pageSize: CATALOG_PAGE_SIZE,
      fetchPage: (page, signal) =>
        fetchJson<ListingsPage>(
          `/api/worldo/cosmetics/marketplace${toQueryString({ ...filters, page, limit: CATALOG_PAGE_SIZE })}`,
          { signal },
        ),
      select: selectListings,
      cache: cachePolicy.livePages,
      enabled: status === 'authenticated',
    };
  }, [rarityFilter, sort, searchTerm, status]);

  return (
    <CatalogLayout
      top={
        <>
          <CatalogHeader
            icon={Store}
            title="Marketplace"
            subtitle="Adquira cosméticos exclusivos de outros usuários"
            action={
              session && (
                <Link href={ROUTES.inventory} className={catalogActionClass.neutral}>
                  <Package className="w-4 h-4 text-purple-400" />
                  Meu Inventário
                </Link>
              )
            }
          />
          <CatalogFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={setSearchTerm}
            searchPlaceholder="Buscar molduras pelo nome..."
            rarities={rarityFilter}
            onRaritiesChange={setRarityFilter}
          />
          <SortSelector options={LISTING_SORT_OPTIONS} value={sort} onChange={setSort} />
        </>
      }
    >
      <MarketplaceVirtualized source={source} />
    </CatalogLayout>
  );
}
