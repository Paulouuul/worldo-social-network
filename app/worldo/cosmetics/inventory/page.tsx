// app/worldo/cosmetics/inventory/page.tsx
// Página /worldo/cosmetics/inventory: inventário de cosméticos do usuário com filtros (situação,
// raridade, busca e ordenação), contadores e modal de ações por item.
'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CatalogHeader,
  CatalogLayout,
  catalogActionClass,
} from '@/components/cosmetics/catalog/CatalogLayout';
import {
  CatalogFilters,
  INVENTORY_SORT_OPTIONS,
  SortSelector,
  toRarityParam,
  type RaritySelection,
} from '@/components/cosmetics/catalog/CatalogFilters';
import { CosmeticActionModal } from '@/components/cosmetics/inventory/CosmeticActionModal';
import { Package, Plus, Store, Box, type LucideIcon } from 'lucide-react';
import { formatItemCount } from '@/lib/utils/formatUtils';
import { LoadingSpinner } from '@/components/ui/feedback/Loading';
import {
  InventoryVirtualized,
  selectInventory,
  type GroupedItem,
  type InventoryPage,
} from '@/components/cosmetics/inventory/InventoryVirtualized';
import type { PagedSource } from '@/components/ui/dataDisplay/VirtualizedPagedGrid';
import { useMe } from '@/hooks/queries/useMe';
import { fetchJson, toQueryString } from '@/lib/api/fetcher';
import { invalidate } from '@/lib/query/invalidate';
import { cachePolicy, qk } from '@/lib/query/queryKeys';
import { ROUTES } from '@/constants/routes';
import { CATALOG_PAGE_SIZE, SORT } from '@/constants/marketplace';

/** Situação dos itens exibidos: todos, à venda ou livres. */
type FilterType = 'all' | 'listed' | 'unlisted';
/** Modo em que o modal de ações abre. */
type ModalMode = 'sell' | 'view' | 'edit' | 'remove' | 'equip' | null;

/**
 * Inventário paginado sob demanda; contadores e páginas são invalidados após cada ação do
 * modal.
 */
export default function MyCosmeticsPage() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  // Filtros
  const [activeFilter, setActiveFilter] = useState<FilterType>('unlisted');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RaritySelection>([]);
  const [sort, setSort] = useState<string>(SORT.newest);

  // Modal de ações
  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // Contadores por situação com os mesmos filtros de busca e raridade da grade.
  // keepPreviousData mantém os números anteriores enquanto os novos carregam.
  const statsFilters = { search: searchTerm, rarity: toRarityParam(rarityFilter) };
  const { data: statsData = { all: 0, listed: 0, unlisted: 0 } } = useQuery({
    queryKey: qk.inventory.stats(statsFilters),
    queryFn: ({ signal }) =>
      fetchJson<{ all: number; listed: number; unlisted: number }>(
        `/api/worldo/cosmetics/inventory/stats${toQueryString(statsFilters)}`,
        { signal },
      ),
    enabled: status === 'authenticated',
    placeholderData: keepPreviousData,
    ...cachePolicy.inventory,
  });
  const hasActiveFilters = !!searchTerm || rarityFilter.length > 0;

  const source = useMemo<PagedSource<GroupedItem, InventoryPage>>(() => {
    const filters = {
      filter: activeFilter,
      search: searchTerm,
      rarity: toRarityParam(rarityFilter),
      sort,
    };
    return {
      baseKey: qk.inventory.list(filters),
      pageSize: CATALOG_PAGE_SIZE,
      fetchPage: (page, signal) =>
        fetchJson<InventoryPage>(
          `/api/worldo/cosmetics/inventory/grouped${toQueryString({ ...filters, page, limit: CATALOG_PAGE_SIZE })}`,
          { signal },
        ),
      select: selectInventory,
      cache: cachePolicy.inventory,
      enabled: status === 'authenticated',
    };
  }, [activeFilter, searchTerm, rarityFilter, sort, status]);

  /** Abre o modal do item: visualização do anúncio para itens à venda, equipar para os demais. */
  const handleOpenItem = (item: GroupedItem) => {
    setSelectedItem(item);
    setModalMode(item.isListed ? 'view' : 'equip');
  };

  /** Invalida inventário e listagens após uma ação do modal. */
  const handleModalSuccess = () => {
    invalidate.inventory(queryClient);
  };

  if (status === 'loading') {
    return <LoadingSpinner text="Acessando cofre de cosméticos..." />;
  }

  return (
    <CatalogLayout
      top={
        <>
          <CatalogHeader
            icon={Package}
            title="Meus Cosméticos"
            subtitle="Gerencie seu inventário e comercialize suas molduras"
            gradientClassName="from-white via-slate-200 to-slate-400"
            action={
              (statsData.all > 0 || hasActiveFilters) && (
                <Link href={ROUTES.createCosmetic} className={catalogActionClass.accent}>
                  <Plus className="w-4 h-4" /> Criar Nova Moldura
                </Link>
              )
            }
          />
          <CatalogFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={setSearchTerm}
            searchPlaceholder="Buscar no inventário..."
            rarities={rarityFilter}
            onRaritiesChange={setRarityFilter}
          />

          {/* Filtros de situação */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5 w-full sm:w-fit shadow-inner backdrop-blur-sm shrink-0">
            <StatusTab
              active={activeFilter === 'unlisted'}
              onClick={() => setActiveFilter('unlisted')}
              icon={Box}
              label="Disponíveis"
              count={statsData.unlisted}
              activeClassName="bg-purple-600 text-white shadow-lg shadow-purple-900/30"
            />
            <StatusTab
              active={activeFilter === 'listed'}
              onClick={() => setActiveFilter('listed')}
              icon={Store}
              label="No Mercado"
              count={statsData.listed}
              activeClassName="bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
            />
            <StatusTab
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              icon={Package}
              label="Todos"
              count={statsData.all}
              activeClassName="bg-slate-700 text-white shadow-lg shadow-slate-900/30"
            />
          </div>

          <SortSelector options={INVENTORY_SORT_OPTIONS} value={sort} onChange={setSort} />
        </>
      }
      overlay={
        selectedItem &&
        modalMode && (
          <CosmeticActionModal
            item={selectedItem}
            mode={modalMode}
            onClose={() => {
              setSelectedItem(null);
              setModalMode(null);
            }}
            onSuccess={handleModalSuccess}
            avatarUrl={me?.avatar || '/default-avatar.png'}
          />
        )
      }
    >
      <InventoryVirtualized source={source} onItemClick={handleOpenItem} />
    </CatalogLayout>
  );
}

/** Propriedades de uma aba de situação do inventário. */
interface StatusTabProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count: number;
  /** Cores da aba quando selecionada. */
  activeClassName: string;
}

/** Aba de situação (disponíveis, no mercado, todos) com contador. */
function StatusTab({ active, onClick, icon: Icon, label, count, activeClassName }: StatusTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${
        active ? activeClassName : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" /> {label}{' '}
      <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
        {formatItemCount(count)}
      </span>
    </button>
  );
}
