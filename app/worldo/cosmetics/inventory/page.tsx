'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ClientImage } from '@/components/ClientImage';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRarityDesigns, RARITY, Rarity } from '@/constants/cosmeticRarity';
import { CosmeticActionModal } from '@/components/CosmeticActionModal';
import { Package, Search, Plus, X, Loader2, Store, CheckCircle, Box } from 'lucide-react';
import { formatItemCount } from '@/lib/format-utils';

interface GroupedItem {
  id: string;
  frameId: string;
  isListed: boolean;
  resalePrice: number | null;
  listingId?: string | null;
  isEquipped: boolean;
  equippedItemId: string | null;
  count: number;
  frame: {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    imageUrl: string;
    rarity: Rarity;
    stock: number;
  };
}

type FilterType = 'all' | 'listed' | 'unlisted';
type ModalMode = 'sell' | 'view' | 'edit' | 'remove' | 'equip' | null;

const rarityDesigns = getRarityDesigns('bottom-2');

export default function MyCosmeticsPage() {
  const { data: session, status } = useSession();

  // Estados da Lista e Filtros
  const [items, setItems] = useState<GroupedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('unlisted');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statsData, setStatsData] = useState({ all: 0, listed: 0, unlisted: 0 });
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');
  const rarityOptions = ['all', RARITY.COMUM, RARITY.RARO, RARITY.EPICO, RARITY.LENDARIO];

  // Estados do Modal
  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/cosmetics/inventory/stats');
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error('Erro ao buscar stats:', err);
    }
  }, []);

  const fetchInventory = useCallback(
    async (page: number, isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await fetch(
          `/api/cosmetics/inventory/grouped?page=${page}&limit=50&filter=${activeFilter}&search=${encodeURIComponent(searchTerm)}&rarity=${rarityFilter}&sort=${sort}`,
        );
        if (!res.ok) throw new Error('Falha ao sincronizar inventário');

        const data = await res.json();

        if (isLoadMore) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }

        setHasMore(data.pagination.hasNextPage);
        setCurrentPage(page);
      } catch (err) {
        console.error('Erro ao processar inventário:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, searchTerm, rarityFilter, sort],
  );

  // Carrega avatar apenas uma vez quando houver a sessão do usuário
  useEffect(() => {
    if (!session?.user) return;

    if (session.user.avatar) {
      setAvatarUrl(session.user.avatar);
    }

    if (!session.user.publicId) return;

    const controller = new AbortController();

    fetch(`/api/user/${session.user.publicId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatarUrl(data.avatar);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort();
  }, [session]);

  // Hook unificado com DEBOUNCE para evitar requisições infinitas na digitação
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.publicId) return;

    fetchStats();

    const timeoutId = setTimeout(() => {
      setItems([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchInventory(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeFilter, searchTerm, rarityFilter, sort, status, session, fetchStats, fetchInventory]);

  // Intersection Observer para o Scroll Infinito
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchInventory(currentPage + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, currentPage, fetchInventory]);

  // Ações do Modal
  const handleOpenItem = (item: GroupedItem) => {
    setSelectedItem(item);
    setModalMode(item.isListed ? 'view' : 'equip');
  };

  const handleModalSuccess = () => {
    fetchInventory(1, false);
    fetchStats();
  };

  // Telas de Carregamento e Não Autenticado
  if (status === 'loading' || (loading && status === 'authenticated' && items.length === 0)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">
          Acessando cofre de cosméticos...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12 relative min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-slate-200 to-slate-400 tracking-wide flex items-center gap-3">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 shrink-0" /> MEUS COSMÉTICOS
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
            Gerencie seu inventário e comercialize suas molduras
          </p>
        </div>
        {items.length > 0 && (
          <Link
            href="/worldo/cosmetics/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-300 py-3 sm:py-2.5 px-5 rounded-xl transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold shadow-lg shadow-purple-900/10"
          >
            <Plus className="w-4 h-4" /> Criar Nova Moldura
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <button
            onClick={() => setSearchTerm(searchInput)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
          >
            <Search className="w-4 h-4 text-slate-500" />
          </button>
          <input
            type="text"
            placeholder="Buscar no inventário..."
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

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {rarityOptions.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setRarityFilter(rarity)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                rarityFilter === rarity
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {rarity === 'all' ? 'Todas' : rarity}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-8 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5 w-full sm:w-fit shadow-inner backdrop-blur-sm">
        <button
          onClick={() => setActiveFilter('unlisted')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'unlisted' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Box className="w-4 h-4 shrink-0" />{' '}
          Disponíveis{' '}
          <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
            {formatItemCount(statsData.unlisted)}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('listed')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'listed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Store className="w-4 h-4 shrink-0" />{' '}
          No Mercado{' '}
          <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
            {formatItemCount(statsData.listed)}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'all' ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
        >
          <Package className="w-4 h-4 shrink-0" /> Todos{' '}
          <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
            {formatItemCount(statsData.all)}
          </span>
        </button>
      </div>

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
      </div>

      <div className="relative min-h-100">
        {loading && items.length === 0 && (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-48 sm:h-52 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
            <Package className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">
              Seu inventário está vazio
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Adquira no marketplace ou crie sua própria moldura!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/worldo/cosmetics/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
              >
                <Store className="w-4 h-4" />
                Ir ao Marketplace
              </Link>
              <Link
                href="/worldo/cosmetics/create"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20"
              >
                <Plus className="w-4 h-4" />
                Criar moldura
              </Link>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
  {items.map((item) => {
    const config =
      rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;
    
    return (
      <button
        key={`${item.frameId}-${item.isListed}`}
        onClick={() => handleOpenItem(item)}
        // Mantemos a estrutura flex-col e justify-between para isolar Topo, Meio e Rodapé
        className={`group relative flex flex-col items-center justify-between p-2.5 sm:p-3 h-48 sm:h-52 rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${config.cardClass} ${
          item.isListed ? 'ring-1 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : ''
        }`}
      >
        {/* Efeitos de fundo da Raridade */}
        {config.bgDecoration}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05]" />

        {/* 1. Header do Card: Tags e Quantidade */}
        <div className="w-full flex justify-between items-start z-20 mb-1 gap-1 min-h-6">
          <div className="flex flex-col gap-1">
            {item.isListed && (
              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.2)] tracking-wider uppercase shrink-0">
                <Store className="w-2.5 h-2.5" /> 
                Venda
              </span>
            )}
            {item.isEquipped && (
              <span className="flex items-center gap-1 text-[8px] font-black text-blue-300 bg-blue-950/90 border border-blue-500/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(59,130,246,0.2)] tracking-wider uppercase shrink-0">
                <CheckCircle className="w-2.5 h-2.5" /> 
                Equipado
              </span>
            )}
          </div>

          <span className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 font-black text-[10px] px-1.5 py-1 rounded-md shadow-lg shrink-0">
            x{formatItemCount(item.count)}
          </span>
        </div>

        {/* 2. Bloco Central: Agrupa Imagem + Badge de forma isolada */}
        <div className="flex flex-col items-center justify-center flex-1 w-full my-1">
          {/* Container da Imagem */}
          <div
            className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105 shadow-xl shrink-0 ${config.borderClass}`}
          >
            <ClientImage
              src={item.frame.thumbnailUrl}
              alt={item.frame.name}
              fill
              className="object-cover drop-shadow-2xl"
              sizes="(max-width: 640px) 72px, 88px"
              unoptimized
            />
          </div>
        </div>

        {/* Container do Badge - Agora forçado para baixo da imagem através do fluxo do flex-col */}
           <div className="relative w-full flex justify-center z-20 mt-1 mb-2 h-6">
                  {config.badge}
                </div>

        {/* 3. Footer do Card: Nome do Item */}
        <div className="w-full z-10 pt-1.5 border-t border-slate-800/40 flex flex-col items-center">
          <span
            className={`block text-[10px] sm:text-xs text-center px-1 truncate w-full drop-shadow-md ${config.textClass}`}
          >
            {item.frame.name}
          </span>
        </div>
      </button>
    );
  })}
</div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            )}

            {hasMore && !loading && !loadingMore && <div ref={loadMoreRef} className="h-10" />}
          </>
        )}
      </div>

      {/* Renderiza o componente Modal Externo */}
      {selectedItem && modalMode && (
        <CosmeticActionModal
          item={selectedItem}
          mode={modalMode}
          onClose={() => {
            setSelectedItem(null);
            setModalMode(null);
          }}
          onSuccess={handleModalSuccess}
          avatarUrl={avatarUrl}
        />
      )}
    </div>
  );
}
