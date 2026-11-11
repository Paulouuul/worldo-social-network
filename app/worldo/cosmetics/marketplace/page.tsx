'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search, Package, Store, X } from 'lucide-react';
import { RARITY, Rarity } from '@/constants/cosmeticRarity';
import {
  MarketplaceVirtualized,
  selectListings,
  type ListingsPage,
} from '@/components/MarketplaceVirtualized';
import type { PagedSource } from '@/components/VirtualizedPagedGrid';
import { fetchJson, toQueryString } from '@/lib/fetcher';
import { cachePolicy, qk } from '@/lib/query-keys';

const PAGE_SIZE = 56;

export default function MarketplacePage() {
  const { data: session, status } = useSession();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sort, setSort] = useState('newest');

  const rarityOptions = ['all', RARITY.COMUM, RARITY.RARO, RARITY.EPICO, RARITY.LENDARIO];

  // Preço/estoque: páginas revalidadas sempre e liberadas da memória ao sair da tela
  const source = useMemo<PagedSource<ListingsPage['listings'][number], ListingsPage>>(() => {
    const filters = { rarity: rarityFilter, sort, search: searchTerm };
    return {
      baseKey: qk.marketplace.list(filters),
      pageSize: PAGE_SIZE,
      fetchPage: (page, signal) =>
        fetchJson<ListingsPage>(
          `/api/worldo/cosmetics/marketplace${toQueryString({ ...filters, page, limit: PAGE_SIZE })}`,
          { signal },
        ),
      select: selectListings,
      cache: cachePolicy.livePages,
      enabled: status === 'authenticated',
    };
  }, [rarityFilter, sort, searchTerm, status]);

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-800/60 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400 tracking-wide flex items-center gap-3">
            <Store className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 shrink-0" />
            MARKETPLACE
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
            Adquira cosméticos exclusivos de outros usuários
          </p>
        </div>
        {session && (
          <Link
            href="/worldo/cosmetics/inventory"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 transition border border-slate-700 hover:border-purple-500/50 text-slate-200 py-3 sm:py-2.5 px-5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/10"
          >
            <Package className="w-4 h-4 text-purple-400" />
            Meu Inventário
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 shrink-0">
        <div className="flex-1 relative">
          <button
            onClick={() => setSearchTerm(searchInput)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
          >
            <Search className="w-4 h-4 text-slate-500" />
          </button>
          <input
            type="text"
            placeholder="Buscar molduras pelo nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(searchInput)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {rarityOptions.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setRarityFilter(rarity as 'all' | Rarity)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                rarityFilter === rarity
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {rarity === 'all' ? 'Todos' : rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2 mb-4 flex-wrap shrink-0">
        <span className="text-xs text-slate-500 font-medium mr-2">Ordenar por:</span>
        {['newest', 'oldest', 'price_asc', 'price_desc'].map((sortOption) => (
          <button
            key={sortOption}
            onClick={() => setSort(sortOption)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              sort === sortOption
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {sortOption === 'newest' && 'Mais recentes'}
            {sortOption === 'oldest' && 'Mais antigos'}
            {sortOption === 'price_asc' && 'Menor preço'}
            {sortOption === 'price_desc' && 'Maior preço'}
          </button>
        ))}
      </div>

      {/* Componente Virtualizado */}
      <div className="flex-1 min-h-0">
        <MarketplaceVirtualized source={source} />
      </div>
    </div>
  );
}
