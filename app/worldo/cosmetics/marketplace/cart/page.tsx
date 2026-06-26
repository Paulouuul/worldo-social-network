'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { backendApiCall } from '@/lib/backendApiClient';
import { useCartSummaryStore } from '@/stores/cartSummaryStore';
import { formatFullNumber, formatItemCount, formatPrice } from '@/lib/format-utils';
import {
  ShoppingCart,
  Coins,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Store,
  CreditCard,
  Loader2,
  Package,
  User,
  AlertTriangle,
} from 'lucide-react';

interface CartItem {
  id: string;
  listing_id: string;
  frame_id: string;
  name: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
  image_url: string;
  thumbnail_url: string;
  max_quantity: number;
  total: number;
  frame?: {
    imageUrl: string;
    thumbnailUrl: string;
    rarity: string;
  };
  in_stock: boolean;
}

interface CartData {
  user_id: string;
  total_items: number;
  total_price: number;
  unique_items_count: number;
  items: CartItem[];
  updated_at: string;
}

// Usamos a configuração base para carregar os badges e classes
const rarityDesigns = getRarityDesigns('static');

export default function CartPage() {
  const { status } = useSession();
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { fetchSummary } = useCartSummaryStore();
  const isInitialLoad = useRef(true);
  const hasRedirected = useRef(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const fetchCart = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/get', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Erro ao buscar carrinho');

      setCart(data.data);

      if (isInitialLoad.current && data.data && data.data.items.length === 0) {
        isInitialLoad.current = false;
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          router.replace('/worldo');
          return;
        }
      }
      isInitialLoad.current = false;
    } catch (err) {
      console.error('Erro ao buscar carrinho:', err);
      setError('Erro ao carregar carrinho');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      handleRemoveItem(itemId);
      return;
    }

    setError('');
    try {
      const res = await backendApiCall(
        `/cosmetics/marketplace/cart/update/${itemId}?quantity=${newQuantity}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
      );

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || {};
        if (errorDetail.max_quantity) setError(`Quantidade máxima disponível: ${errorDetail.max_quantity}`);
        else throw new Error(errorDetail.error || 'Erro ao atualizar quantidade');
        return;
      }

      await fetchCart(false);
      await fetchSummary();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar quantidade');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setError('');
    try {
      const res = await backendApiCall(`/cosmetics/marketplace/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Erro ao remover item');

      await fetchCart(false);
      await fetchSummary();
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  const handleClearCart = async () => {
    setSubmitting(true);
    setError('');
    setIsClearModalOpen(false);

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Erro ao limpar carrinho');

      await fetchCart(false);
      await fetchSummary();
      setSuccess('Carrinho esvaziado com sucesso!');
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao limpar carrinho');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleValidate = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || {};
        setError(errorDetail.error || errorDetail.message || 'Erro ao validar carrinho');
        await fetchCart(false);
        return;
      }
      router.push('/worldo/cosmetics/marketplace/checkout');
    } catch (err) {
      console.error('Erro ao validar carrinho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao validar carrinho');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading || redirecting) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Carregando Carrinho...
        </p>
      </div>
    );
  }

  const getItemConfig = (rarity: string | undefined) => {
    return rarityDesigns[rarity?.toUpperCase() || ''] || rarityDesigns.COMUM;
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Modal de Limpeza */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Esvaziar Carrinho?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Todos os itens serão removidos e você precisará adicioná-los novamente. Essa ação não
              pode ser desfeita.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearCart}
                className="flex-[1.5] bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
              >
                Esvaziar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-200 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-purple-500" />
            Meu Carrinho
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {formatItemCount(cart?.unique_items_count || 0)} item(ns) •{' '}
            {formatItemCount(cart?.total_items || 0)} unidades
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {!isEmpty && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={submitting || isEmpty}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition text-red-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 flex items-start gap-3 transition-opacity duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm whitespace-pre-line">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 mb-6 flex items-center gap-3 transition-opacity duration-300">
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Grid: Items + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de itens ou Mensagem Vazia */}
        <div className="lg:col-span-2 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6">
                <ShoppingCart className="w-12 h-12 text-slate-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-200 mb-2">
                Seu carrinho está vazio
              </h2>
              <p className="text-slate-400 max-w-md mb-6">
                Explore o marketplace e adicione molduras incríveis ao seu carrinho!
              </p>
              <Link
                href="/worldo/cosmetics/marketplace"
                className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
              >
                <Store className="w-5 h-5" />
                Explorar Marketplace
              </Link>
            </div>
          ) : (
            cart.items.map((item) => {
              const config = getItemConfig(item.frame?.rarity);
              const isOutOfStock = !item.in_stock || item.max_quantity === 0;
              const isQuantityAdjusted = item.quantity > item.max_quantity;

              return (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all group border ${
                    isOutOfStock
                      ? 'border-red-500/30 opacity-60 grayscale-50'
                      : isQuantityAdjusted
                        ? 'border-amber-500/30'
                        : config.cardClass || 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  {/* Efeitos de Fundo (Mesmo do Marketplace) */}
                  {!isOutOfStock && config.bgDecoration}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none z-0" />

                  <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:items-center">
                    {/* Esquerda: Imagem + Badge de Raridade */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center shadow-xl transition-transform duration-500 sm:group-hover:scale-105 ${config.borderClass || 'border-slate-700'}`}
                      >
                        <ClientImage
                          src={item.thumbnail_url || item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover drop-shadow-2xl"
                          sizes="(max-width: 640px) 96px, 112px"
                          unoptimized
                        />
                      </div>

                      {/* Pílula de Raridade Substituindo o Texto Antigo */}
                      <div className="relative w-full flex justify-center z-20 -mt-3 h-6">
                        {config.badge}
                      </div>
                    </div>

                    {/* Direita: Informações */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/worldo/cosmetics/marketplace/${item.listing_id}`}
                            className={`font-bold text-lg sm:text-xl hover:underline transition truncate block drop-shadow-md ${config.textClass}`}
                          >
                            {item.name}
                          </Link>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate max-w-25 sm:max-w-37.5 font-medium">
                                {item.seller_name}
                              </span>
                            </span>
                          </div>

                          {isOutOfStock && (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md mt-2">
                              Sem estoque
                            </span>
                          )}
                          {isQuantityAdjusted && !isOutOfStock && (
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md mt-2">
                              Ajustado: {item.max_quantity} un
                            </span>
                          )}
                        </div>

                        {/* Tag de Preço com estilo Marketplace (Glassmorphism + Neon) */}
                        <span className="flex items-center gap-1.5 text-sm sm:text-base font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm shrink-0 mt-2 sm:mt-0">
                          <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || submitting}
                            aria-label="Diminuir quantidade"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 transition flex items-center justify-center text-slate-300 border border-slate-700 backdrop-blur-sm"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="w-8 sm:w-12 text-center font-bold text-slate-200 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={
                              item.quantity >= item.max_quantity || submitting || isOutOfStock
                            }
                            aria-label="Aumentar quantidade"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 transition flex items-center justify-center text-slate-300 border border-slate-700 backdrop-blur-sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="hidden sm:inline-block text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
                            Estoque: {formatFullNumber(item.max_quantity)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={submitting}
                            aria-label="Remover item do carrinho"
                            className="text-red-400 hover:text-red-300 transition p-2 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5 border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sm:hidden text-xs font-semibold">Remover</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resumo / Checkout */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-black text-slate-200 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Resumo
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Itens</span>
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart?.total_items || 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Produtos únicos</span>
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart?.unique_items_count || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 text-lg">
                <span className="text-slate-400 font-bold">Total</span>
                <span className="font-black text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-5 h-5" />
                  {formatPrice(cart?.total_price || 0)}
                </span>
              </div>
            </div>

            {/* Avisos */}
            {!isEmpty && cart?.items.some((item) => !item.in_stock || item.max_quantity === 0) && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <span>Alguns itens estão sem estoque. Remova-os para continuar.</span>
              </div>
            )}

            {!isEmpty &&
              cart?.items.some((item) => item.quantity > item.max_quantity && item.in_stock) && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2">
                  <span>Algumas quantidades foram ajustadas devido ao estoque disponível.</span>
                </div>
              )}

            <div className="mt-6 space-y-3">
              {!isEmpty && (
                <button
                  onClick={handleValidate}
                  disabled={submitting || isEmpty || cart?.items.some((item) => !item.in_stock)}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Validar e ir para Checkout
                    </>
                  )}
                </button>
              )}
              <Link
                href="/worldo/cosmetics/marketplace"
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium py-3 rounded-xl hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Continuar comprando
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 text-center font-medium">
              {cart?.updated_at
                ? `Última atualização: ${new Date(cart.updated_at).toLocaleString('pt-BR')}`
                : 'Seu carrinho aguarda itens!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
