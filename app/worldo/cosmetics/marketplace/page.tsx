'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClientImage } from '@/components/ClientImage';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, Coins, User, Package, Sparkles, Store, X } from 'lucide-react';
import { formatItemCount } from '@/lib/format-utils';
import { getRarityDesigns, RARITY, Rarity } from '@/constants/cosmeticRarity';

interface MarketplaceListing {
  id: string;
  frameId: string;
  quantity: number;
  priceCoins: number;
  frame: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    rarity: Rarity;
    creator: { name: string; username: string; avatar: string | null };
  };
  seller: { publicId: string; name: string; username: string; avatar: string | null };
}

const rarityDesigns = getRarityDesigns('bottom-2');

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sort, setSort] = useState('newest');
  const rarityOptions = ['all', RARITY.COMUM, RARITY.RARO, RARITY.EPICO, RARITY.LENDARIO];

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    setLoading(true);
    const url = new URL('/api/cosmetics/marketplace', window.location.origin);

    if (rarityFilter !== 'all') url.searchParams.set('rarity', rarityFilter);
    url.searchParams.set('sort', sort); // Adiciona o parâmetro de ordenação
    url.searchParams.set('limit', '50');

    if (searchTerm) {
      url.searchParams.set('search', searchTerm);
    }

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        setListings(data.listings || []);
        setOwnedItems(data.ownedFrameIds || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar marketplace:', err);
        setLoading(false);
      });
  }, [rarityFilter, sort, searchTerm]);

  if (loading && listings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <Store className="w-8 h-8 text-purple-500" />
            Marketplace de Molduras
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Adquira cosméticos exclusivos de outros usuários
          </p>
        </div>
        {session && (
          <Link
            href="/worldo/cosmetics/inventory"
            className="btn-secondary flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition border border-slate-700 hover:border-purple-500/50"
          >
            <Package className="w-4 h-4 text-purple-400" />
            Meu Inventário
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />

          <button
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {rarityOptions.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setRarityFilter(rarity as 'all' | Rarity)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-[transform,colors] whitespace-nowrap ${
                rarityFilter === rarity
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30 border-transparent'
                  : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {rarity === 'all' ? 'Todos' : rarity}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 font-medium mr-2">Ordenar por:</span>
        {[
          { id: 'newest', label: 'Mais recentes' },
          { id: 'oldest', label: 'Mais antigos' },
          { id: 'price_asc', label: 'Menor preço' },
          { id: 'price_desc', label: 'Maior preço' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSort(option.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              sort === option.id
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Grid Premium */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
          <Sparkles className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">
            Nenhuma oferta encontrada
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Não há molduras disponíveis no mercado no momento. Tente buscar por algo diferente!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
          {listings.map((listing) => {
            const isOwned = ownedItems.includes(listing.frame.id);
            const config =
              rarityDesigns[listing.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;

            return (
              <Link
                key={listing.id}
                href={`/worldo/cosmetics/marketplace/${listing.id}`}
                className={`group relative flex flex-col items-center justify-between p-3 sm:p-4 h-62.5 sm:h-67.5 rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${config.cardClass}`}
              >
                {/* Efeitos de fundo da Raridade */}
                {config.bgDecoration}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05]" />

                {/* Header: Preço e Status/Quantidade */}
                <div className="w-full flex justify-between items-start z-20 mb-2 gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm">
                    <Coins className="w-3 h-3" /> {formatItemCount(listing.priceCoins)}
                  </span>

                  {isOwned ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-black text-[9px] px-1.5 py-1 rounded-md shadow-lg backdrop-blur-md flex items-center uppercase shrink-0">
                      ✓ Adquirido
                    </span>
                  ) : (
                    <span className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 font-black text-[10px] px-2 py-1 rounded-md shadow-lg shrink-0">
                      x{formatItemCount(listing.quantity)}
                    </span>
                  )}
                </div>

                {/* Imagem da Moldura */}
                <div
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 shadow-xl ${config.borderClass}`}
                >
                  <ClientImage
                    src={listing.frame.thumbnailUrl || listing.frame.imageUrl}
                    alt={listing.frame.name}
                    fill
                    className="object-cover drop-shadow-2xl"
                    sizes="(max-width: 640px) 96px, 112px"
                    unoptimized
                  />
                </div>

                {/* Pílula de Raridade flutuando sobre a imagem */}
                <div className="relative w-full flex justify-center z-20 mt-1 h-6">
                  {config.badge}
                </div>
                {/* Footer: Nome da Moldura e Vendedor */}
                <div className="mt-auto w-full z-10 pt-2 border-t border-slate-800/40 flex flex-col items-center">
                  <span
                    className={`block text-xs sm:text-sm text-center px-1 truncate w-full drop-shadow-md ${config.textClass}`}
                  >
                    {listing.frame.name}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 truncate max-w-full">
                    <User className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{listing.seller.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
