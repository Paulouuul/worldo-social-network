// app/worldo/cosmetics/seller/[user_identifier]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { getRarityDesigns, RARITY, Rarity } from '@/constants/cosmeticRarity';
import { formatItemCount } from '@/lib/format-utils';
import {
  ArrowLeft,
  Coins,
  User,
  Package,
  Store,
  Search,
  X,
  Sparkles,
  Calendar,
  Loader2,
} from 'lucide-react';

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

interface ApiResponse {
  seller: SellerData;
  listings: ListingData[];
  total: number;
  page: number;
  totalPages: number;
  ownedFrameIds: string[];
  sellerId: string;
}

const rarityDesigns = getRarityDesigns('bottom-2');

export default function SellerPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const userIdentifier = params.user_identifier as string;

  const [seller, setSeller] = useState<SellerData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const rarityOptions = ['all', RARITY.COMUM, RARITY.RARO, RARITY.EPICO, RARITY.LENDARIO];
  const ITEMS_PER_PAGE = 24;

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    if (!userIdentifier) return;

    const fetchSellerData = async () => {
      setLoading(true);
      setError('');

      try {
        const url = new URL(`/api/cosmetics/seller/${userIdentifier}`, window.location.origin);

        if (rarityFilter !== 'all') url.searchParams.set('rarity', rarityFilter);
        url.searchParams.set('sort', sort);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', ITEMS_PER_PAGE.toString());

        if (searchTerm) {
          url.searchParams.set('search', searchTerm);
        }

        const res = await fetch(url.toString());

        if (!res.ok) {
          if (res.status === 404) {
            setError('Vendedor não encontrado');
          } else {
            setError('Erro ao carregar dados do vendedor');
          }
          setLoading(false);
          return;
        }

        const data: ApiResponse = await res.json();
        setSeller(data.seller);
        setListings(data.listings);
        setOwnedItems(data.ownedFrameIds || []);
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
      } catch (err) {
        console.error('Erro ao carregar dados do vendedor:', err);
        setError('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [userIdentifier, rarityFilter, sort, searchTerm, page]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [rarityFilter, sort, searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && !seller) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Carregando vendedor...
        </p>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 sm:gap-2 text-xs font-bold text-slate-500 mb-4 sm:mb-6 uppercase tracking-wider">
        <Link
          href="/worldo/cosmetics/marketplace"
          className="hover:text-purple-400 transition flex items-center gap-1 shrink-0"
        >
          <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline">Marketplace</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 truncate max-w-32 xs:max-w-48 sm:max-w-md" title={seller.name}>
          {seller.name}
        </span>
      </div>

      {/* Perfil do Vendedor */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
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

      {/* Filtros - mesmo estilo do marketplace/inventário */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <button
            onClick={handleSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
          >
            <Search className="w-4 h-4 text-slate-500" />
          </button>
          <input
            type="text"
            placeholder="Buscar itens deste vendedor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-slate-200 placeholder:text-slate-500 text-sm"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
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

      {/* Ordenação - mesmo estilo do marketplace */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 font-medium mr-2">Ordenar por:</span>
        <button
          onClick={() => setSort('newest')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'newest'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Mais recentes
        </button>
        <button
          onClick={() => setSort('oldest')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'oldest'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Mais antigos
        </button>
        <button
          onClick={() => setSort('price_asc')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'price_asc'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Menor preço
        </button>
        <button
          onClick={() => setSort('price_desc')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'price_desc'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Maior preço
        </button>
      </div>

      {/* Grid de Itens */}
      {loading && listings.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
          <Package className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">Nenhum item à venda</h3>
          <p className="text-sm text-slate-500 max-w-md">
            {searchTerm || rarityFilter !== 'all'
              ? 'Nenhum item encontrado com os filtros aplicados.'
              : `${seller.name} não tem nenhum item à venda no momento.`}
          </p>
          {(searchTerm || rarityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
                setRarityFilter('all');
              }}
              className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-bold underline-offset-2 underline transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
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
                  {config.bgDecoration}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05]" />

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

                  <div className="relative w-full flex justify-center z-20 mt-1 h-6">
                    {config.badge}
                  </div>

                  <div className="mt-auto w-full z-10 pt-2 border-t border-slate-800/40 flex flex-col items-center">
                    <span
                      className={`block text-xs sm:text-sm text-center px-1 truncate w-full drop-shadow-md ${config.textClass}`}
                      title={listing.frame.name}
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-800"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition ${
                        page === pageNum
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                          : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-800"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Contador de resultados */}
      {!loading && listings.length > 0 && (
        <p className="text-center text-xs text-slate-500 mt-4">
          Mostrando {listings.length} de {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </p>
      )}
    </div>
  );
}