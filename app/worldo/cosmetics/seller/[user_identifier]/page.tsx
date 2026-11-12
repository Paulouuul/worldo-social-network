// app/worldo/cosmetics/seller/[user_identifier]/page.tsx
// Página /worldo/cosmetics/seller/[user_identifier]: loja de um vendedor com perfil, busca,
// filtros e grade virtualizada dos anúncios.
'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import type { Rarity } from '@/constants/cosmeticRarity';
import { CatalogLayout } from '@/components/catalog/CatalogLayout';
import {
  CatalogFilters,
  LISTING_SORT_OPTIONS,
  SortSelector,
  type RarityFilterValue,
} from '@/components/catalog/CatalogFilters';
import { ArrowLeft, Package, Store, Sparkles, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/Loading';
import { MarketplaceVirtualized, selectListings } from '@/components/MarketplaceVirtualized';
import { pageQueryOptions, type PagedSource } from '@/components/VirtualizedPagedGrid';
import { fetchJson, HttpError, toQueryString } from '@/lib/fetcher';
import { cachePolicy, qk } from '@/lib/query-keys';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

/** Dados públicos do vendedor. */
interface SellerData {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  memberSince: string;
  equippedFrame: {
    imageUrl: string;
    rarity: Rarity;
  } | null;
}

/** Anúncio do vendedor. */
interface ListingData {
  id: string;
  frameId: string;
  sellerId: string;
  priceCoins: number;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  frame: {
    id: string;
    name: string;
    rarity: Rarity;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    creator: {
      id: string;
      name: string;
      username: string;
      avatar: string | null;
    };
  };
  seller: {
    publicId: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

/** Página retornada por /api/worldo/cosmetics/seller/[id]. */
interface ApiResponse {
  seller: SellerData;
  listings: ListingData[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  ownedFrameIds: string[];
  sellerId: string;
}

/** Loja do vendedor. O cabeçalho reaproveita a query da página 1 da grade. */
export default function SellerPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const userIdentifier = params.user_identifier as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilterValue>('all');
  const [sort, setSort] = useState('newest');

  const ITEMS_PER_PAGE = 56;

  const source = useMemo<PagedSource<ListingData, ApiResponse>>(() => {
    const filters = { rarity: rarityFilter, sort, search: searchTerm };
    return {
      baseKey: qk.seller.list(userIdentifier, filters),
      pageSize: ITEMS_PER_PAGE,
      fetchPage: (page, signal) =>
        fetchJson<ApiResponse>(
          `/api/worldo/cosmetics/seller/${encodeURIComponent(userIdentifier)}${toQueryString({ ...filters, page, limit: ITEMS_PER_PAGE })}`,
          { signal },
        ),
      select: selectListings,
      cache: cachePolicy.livePages,
      enabled: status === 'authenticated' && !!userIdentifier,
    };
  }, [userIdentifier, rarityFilter, sort, searchTerm, status]);

  // Mesma query da página 1 usada pela grade (deduplicada pelo React Query).
  // keepPreviousData mantém o cabeçalho do vendedor visível enquanto os filtros mudam.
  const firstPage = useQuery({ ...pageQueryOptions(source, 1), placeholderData: keepPreviousData });
  const seller = firstPage.data?.seller ?? null;
  const totalItems = firstPage.data?.total ?? 0;
  const error = firstPage.error
    ? firstPage.error instanceof HttpError && firstPage.error.status === 404
      ? 'Vendedor não encontrado'
      : 'Erro ao carregar dados do vendedor'
    : '';
  const loading = firstPage.isPending;

  if (loading && !seller) {
    return <LoadingSpinner text="Carregando vendedor..." />;
  }

  if (error || !seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="bg-slate-900/50 p-6 rounded-full mb-6 border border-slate-800">
          <Store className="w-16 h-16 text-slate-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-200 mb-2">
          {error === 'Vendedor não encontrado' ? 'Vendedor não encontrado' : 'Erro ao carregar'}
        </h2>
        <p className="text-slate-400 mb-6 max-w-md">
          {error === 'Vendedor não encontrado'
            ? 'Este vendedor não existe ou foi removido.'
            : 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.'}
        </p>
        <Link
          href="/worldo/cosmetics/marketplace"
          className="bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-white px-6 py-3 rounded-xl transition flex items-center gap-2 font-bold shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Marketplace
        </Link>
      </div>
    );
  }

  const isOwnStore = session?.user?.publicId === seller.id;

  return (
    <CatalogLayout
      top={
        <>
          {/* Breadcrumb */}
          <Breadcrumb current={seller.name} />

          {/* Perfil do vendedor */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 backdrop-blur-xl shadow-2xl relative overflow-hidden shrink-0">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 relative z-10">
              <AvatarWithFrame
                avatarUrl={seller.avatar}
                name={seller.name}
                frameUrl={seller.equippedFrame?.imageUrl}
                rarity={seller.equippedFrame?.rarity}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32"
                priority
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-200 wrap-break-word">
                    {seller.name}
                  </h1>
                  {isOwnStore && (
                    <span className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 w-fit">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden xs:inline">Sua Loja</span>
                      <span className="xs:hidden">Loja</span>
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3">@{seller.username}</p>

                {seller.bio && (
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed wrap-break-word">
                    {seller.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Membro desde {new Date(seller.memberSince).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} à venda
                  </span>
                </div>
              </div>
            </div>
          </div>

          <CatalogFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={setSearchTerm}
            searchPlaceholder="Buscar itens deste vendedor..."
            rarity={rarityFilter}
            onRarityChange={setRarityFilter}
          />
          <SortSelector options={LISTING_SORT_OPTIONS} value={sort} onChange={setSort} />
        </>
      }
    >
      <MarketplaceVirtualized
        source={source}
        emptyMessage="Este vendedor não possui itens à venda com esses filtros."
      />
    </CatalogLayout>
  );
}
