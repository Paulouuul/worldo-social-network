'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { getRarityDesigns, Rarity } from '@/constants/cosmeticRarity';
import { backendApiCall } from '@/lib/backendApiClient';
import { useCartSummaryStore } from '@/stores/cartSummaryStore';
import { formatItemCount, formatFullNumber, formatPrice } from '@/lib/format-utils';
import {
  Coins,
  User,
  Store,
  Package,
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Minus,
  Plus,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

interface ListingData {
  id: string;
  priceCoins: number;
  quantity: number;
  createdAt: string;
  isOwnListing: boolean;
  frame: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    rarity: Rarity;
    creator: {
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
    };
  };
  seller: {
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
  };
  sellerOtherListings: {
    id: string;
    priceCoins: number;
    quantity: number;
    frame: {
      id: string;
      name: string;
      thumbnailUrl: string;
      imageUrl: string;
      rarity: Rarity;
    };
  }[];
}

const rarityDesigns = getRarityDesigns('static');

export default function ListingDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [cartQuantity, setCartQuantity] = useState(0);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [loadingCart, setLoadingCart] = useState(false);
  const { fetchSummary } = useCartSummaryStore();

  const listingId = params.listing_id as string;
  const MAX_QUANTITY_PER_ITEM = 99;

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    fetch(`/api/cosmetics/listings/${listingId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Anúncio não encontrado');
        return res.json();
      })
      .then((data) => {
        setListing(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [listingId]);

  useEffect(() => {
    if (!session?.user?.id || !listing) return;

    const fetchCartQuantity = async () => {
      setLoadingCart(true);
      try {
        const res = await backendApiCall(`/cosmetics/marketplace/cart/item/${listingId}/quantity`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (res.ok && data.data) {
          const quantityInCart = data.data.quantity || 0;
          setCartQuantity(quantityInCart);

          const available = listing.quantity - quantityInCart;
          setAvailableQuantity(Math.max(0, available));

          const initialQuantity = available > 0 ? 1 : 0;
          setBuyQuantity(initialQuantity);
        }
      } catch (error) {
        console.error('Erro ao buscar quantidade no carrinho:', error);
        setAvailableQuantity(listing.quantity);
      } finally {
        setLoadingCart(false);
      }
    };

    fetchCartQuantity();
  }, [session, listingId, listing]);

  const handleIncrement = () => {
    if (buyQuantity < availableQuantity && buyQuantity < MAX_QUANTITY_PER_ITEM) {
      setBuyQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (buyQuantity > 1) {
      setBuyQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!listing) return;
    if (buyQuantity > availableQuantity) {
      setError(
        `Você já tem ${cartQuantity} unidades no carrinho. Disponível: ${availableQuantity}`,
      );
      return;
    }

    if (buyQuantity <= 0) {
      setError('Selecione pelo menos 1 unidade');
      return;
    }

    setBuying(true);
    setError('');

    try {
      const itemData = {
        listing_id: listing.id,
        frame_id: listing.frame.id,
        name: listing.frame.name,
        price: listing.priceCoins,
        seller_id: listing.seller.id,
        seller_name: listing.seller.name,
        image_url: listing.frame.imageUrl,
        thumbnail_url: listing.frame.thumbnailUrl,
        max_quantity: listing.quantity,
        quantity: buyQuantity,
      };

      const res = await backendApiCall('/cosmetics/marketplace/cart/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_data: itemData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || data.error || 'Erro ao adicionar ao carrinho');
        return;
      }
      await fetchSummary();
      router.push('/worldo/cosmetics/marketplace/cart');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Buscando Oferta...
        </p>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 opacity-80" />
        <h2 className="text-2xl font-black text-slate-200 mb-2">Oferta Não Encontrada</h2>
        <p className="text-slate-400 mb-6 max-w-md">
          Este anúncio não existe mais, foi comprado por outro usuário ou removido pelo vendedor.
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

  if (!listing) return null;

  const config = rarityDesigns[listing.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;
  const isEsgotado = listing.quantity === 0;
  const isAllInCart = availableQuantity === 0 && cartQuantity > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">
        <Link
          href="/worldo/cosmetics/marketplace"
          className="hover:text-purple-400 transition flex items-center gap-1"
        >
          <Store className="w-3.5 h-3.5" /> Marketplace
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className={`${config.textClass} truncate max-w-50 sm:max-w-md`}>
          {listing.frame.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Lado Esquerdo: Preview com AvatarWithFrame */}
        <div className="lg:col-span-2">
          <div
            className={`relative rounded-3xl border overflow-hidden flex flex-col items-center justify-center p-8 min-h-100 h-full shadow-2xl ${config.cardClass}`}
          >
            {config.bgDecoration}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none" />

            <div className="z-10 relative flex flex-col items-center mt-auto mb-auto w-full">
              <div className="mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
                <AvatarWithFrame
                  avatarUrl={session?.user?.avatar}
                  name={session?.user?.name}
                  frameUrl={listing.frame.imageUrl}
                  rarity={listing.frame.rarity}
                  className="w-40 h-40 md:w-52 md:h-52"
                  priority
                />
              </div>

              {config.badge}

              <p className="text-center text-xs text-slate-400 font-medium mt-6 bg-slate-950/60 px-5 py-2 rounded-full border border-slate-800/80 backdrop-blur-md shadow-inner flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 opacity-70" />
                Preview aplicado ao seu avatar
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Informações do Anúncio */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Header do Item */}
          <div className="pb-6 border-b border-slate-800/60">
            <h1
              className={`text-3xl sm:text-5xl font-black mb-4 tracking-tight drop-shadow-sm ${config.textClass}`}
            >
              {listing.frame.name}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
              {listing.frame.description}
            </p>
          </div>

          {/* Cards de Perfil (Vendedor & Criador) */}
          {!listing.isOwnListing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href={`/worldo/seller/${listing.seller.id}`}
                className="group flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-800/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all relative overflow-hidden"
              >
                <AvatarWithFrame
                  avatarUrl={listing.seller.avatar}
                  name={listing.seller.name}
                  frameUrl={listing.seller.equippedFrame?.imageUrl}
                  rarity={listing.seller.equippedFrame?.rarity}
                  size="sm"
                />
                <div className="flex-1 overflow-hidden z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Store className="w-3 h-3 text-emerald-500" /> Vendedor
                  </p>
                  <p className="font-bold text-slate-200 group-hover:text-emerald-400 transition truncate text-sm">
                    {listing.seller.name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors z-10 group-hover:translate-x-1" />
              </Link>

              <Link
                href={`/worldo/perfil/${listing.frame.creator.id}`}
                className="group flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-purple-500/50 hover:bg-slate-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all"
              >
                <AvatarWithFrame
                  avatarUrl={listing.frame.creator.avatar}
                  name={listing.frame.creator.name}
                  frameUrl={listing.frame.creator.equippedFrame?.imageUrl}
                  rarity={listing.frame.creator.equippedFrame?.rarity}
                  size="sm"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Criador Original
                  </p>
                  <p className="font-bold text-slate-200 group-hover:text-purple-400 transition truncate text-sm">
                    {listing.frame.creator.name}
                  </p>
                </div>
                <User className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </Link>
            </div>
          )}
          {/* Área de Compra Glassmorphic */}
          <div className="p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl mt-auto relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-slate-800/80 gap-4 relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Preço Unitário
                </p>
                <div className="flex items-center gap-2.5">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 drop-shadow-md">
                    {formatFullNumber(listing.priceCoins)}
                  </span>
                  <Coins className="w-7 h-7 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                </div>
              </div>

              <div className="sm:text-right bg-slate-950/50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-800 sm:border-none">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Disponibilidade
                </p>
                <div className="flex flex-col sm:items-end">
                  <p className="text-lg font-bold text-slate-200 flex items-center gap-2 justify-start sm:justify-end">
                    <Package className="w-4 h-4 text-slate-400" />
                    {loadingCart ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <span>{formatFullNumber(listing.quantity)} em estoque</span>
                    )}
                  </p>
                  {cartQuantity > 0 && !listing.isOwnListing && (
                    <span className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {cartQuantity} já no seu carrinho
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Se for anúncio do próprio usuário */}
              {listing.isOwnListing ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <div className="bg-purple-500/20 p-4 rounded-full">
                    <Package className="w-12 h-12 text-purple-400" />
                  </div>
                  <p className="text-center text-slate-300 font-medium">Este é seu anúncio</p>
                  <p className="text-center text-sm text-slate-400 max-w-sm">
                    Gerencie seus itens e anúncios no seu inventário
                  </p>
                  <Link
                    href="/worldo/cosmetics/inventory"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-900/30"
                  >
                    <Package className="w-4 h-4" />
                    Ver no Inventário
                  </Link>
                </div>
              ) : isAllInCart ? (
                // 1. TUDO JÁ ADICIONADO AO CARRINHO
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-400 font-medium">
                    <div className="bg-emerald-500/20 p-1.5 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    Você já adicionou todo o estoque disponível ao seu carrinho.
                  </div>

                  <Link
                    href="/worldo/cosmetics/marketplace/cart"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Ver no Carrinho
                  </Link>
                </div>
              ) : isEsgotado ? (
                // 2. ESGOTADO GERAL
                <div className="w-full bg-slate-900 border border-slate-800 text-slate-500 font-black text-sm uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <AlertTriangle className="w-5 h-5" />
                  Produto Esgotado
                </div>
              ) : (
                // 3. NORMAL - SELETOR DE QUANTIDADE E BOTÃO DE COMPRAR
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Controle Customizado de Quantidade */}
                    <div className="w-full sm:w-2/5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Quantidade
                      </label>
                      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner h-14">
                        <button
                          type="button"
                          onClick={handleDecrement}
                          disabled={buyQuantity <= 1 || buying || loadingCart}
                          className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="font-black text-lg text-slate-200 w-12 text-center">
                          {buyQuantity}
                        </span>

                        <button
                          type="button"
                          onClick={handleIncrement}
                          disabled={buyQuantity >= availableQuantity || buying || loadingCart}
                          className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="w-full sm:w-3/5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:text-right">
                        Total a pagar
                      </label>
                      <div className="w-full bg-slate-950/50 border border-slate-800/60 shadow-inner rounded-xl px-4 h-14 flex justify-between sm:justify-end items-center gap-3">
                        <span className="text-slate-500 font-medium text-sm sm:hidden">Total:</span>
                        <div className="flex items-center gap-2 text-2xl font-black text-amber-400">
                          {formatPrice(listing.priceCoins * buyQuantity)}
                          <Coins className="w-5 h-5 text-amber-500/80" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <button
                    onClick={handleAddToCart}
                    disabled={buying || loadingCart || availableQuantity === 0}
                    className="w-full relative group overflow-hidden bg-slate-800 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all hover:shadow-[0_10px_30px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {/* Efeito Hover animado de gradiente */}
                    <div className="absolute inset-0 w-full h-full bg-linear-to-r from-purple-600 to-indigo-600 transition-opacity duration-300 opacity-90 group-hover:opacity-100" />

                    <span className="relative z-10 flex items-center gap-2 group-hover:-translate-y-0.5 transition-transform">
                      {buying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Adicionar ao Carrinho
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}

              {/* Mensagem de Erro */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold p-4 rounded-xl flex items-center gap-3 justify-center animate-in fade-in zoom-in-95 duration-300">
                  <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-6 mt-6 border-t border-slate-800/80 relative z-10">
              <Calendar className="w-3.5 h-3.5" />
              <span>Listado em {new Date(listing.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outros anúncios do vendedor */}
      {listing.sellerOtherListings.length > 0 && !listing.isOwnListing && (
        <div className="mt-20 pt-10 border-t border-slate-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-black text-slate-200 flex items-center gap-3">
              <Store className="w-7 h-7 text-emerald-400" />
              Mais itens de {listing.seller.name}
            </h2>

            <Link
              href={`/worldo/seller/${listing.seller.id}`}
              className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
            >
              Ver Catálogo Completo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {listing.sellerOtherListings.map((item) => {
              const itemConfig =
                rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;

              return (
                <Link
                  key={item.id}
                  href={`/worldo/cosmetics/marketplace/${item.id}`}
                  className={`group relative flex flex-col items-center justify-between p-3 sm:p-4 h-60 sm:h-65 rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] ${itemConfig.cardClass}`}
                >
                  {itemConfig.bgDecoration}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none" />

                  <div className="w-full flex justify-between items-start z-20 mb-2 gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm">
                      <Coins className="w-3 h-3" /> {formatPrice(item.priceCoins)}
                    </span>
                    <span className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-300 font-black text-[10px] px-2 py-1 rounded-md shadow-lg shrink-0">
                      📦 x{formatItemCount(item.quantity)}
                    </span>
                  </div>

                  <div
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 shadow-xl ${itemConfig.borderClass}`}
                  >
                    <ClientImage
                      src={item.frame.thumbnailUrl || item.frame.imageUrl}
                      alt={item.frame.name}
                      fill
                      className="object-cover drop-shadow-2xl"
                      sizes="(max-width: 640px) 96px, 112px"
                      unoptimized
                    />
                  </div>

                  <div className="relative w-full flex justify-center z-20 mt-2 h-6">
                    <div className="scale-75 origin-top">{itemConfig.badge}</div>
                  </div>

                  <div className="mt-auto w-full z-10 pt-3 border-t border-slate-800/40">
                    <span
                      className={`block text-xs sm:text-sm text-center px-1 truncate font-bold drop-shadow-md ${itemConfig.textClass}`}
                    >
                      {item.frame.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
