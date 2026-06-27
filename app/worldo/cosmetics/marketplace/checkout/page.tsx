// app/worldo/cosmetics/marketplace/checkout/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { backendApiCall } from '@/lib/backendApiClient';
import { useCoinStore } from '@/stores/coinStore';
import { useCartSummaryStore } from '@/stores/cartSummaryStore';
import { formatFullNumber, formatItemCount, formatPrice } from '@/lib/format-utils';
import {
  ArrowLeft,
  Coins,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Package,
  CreditCard,
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
}

const rarityDesigns = getRarityDesigns('static');

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { balance: userBalance, fetchBalance } = useCoinStore();
  const { fetchSummary } = useCartSummaryStore();

  const isInitialLoad = useRef(true);
  const hasRedirected = useRef(false);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  useEffect(() => {
    const loadCheckoutData = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Busca carrinho
        const cartRes = await backendApiCall('/cosmetics/marketplace/cart/get', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const cartData = await cartRes.json();

        if (!cartRes.ok) {
          throw new Error(cartData.detail || 'Erro ao buscar carrinho');
        }

        // Redirecionamento silencioso caso o carrinho esteja vazio
        if (isInitialLoad.current && (!cartData.data || cartData.data.items.length === 0)) {
          isInitialLoad.current = false;
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            setRedirecting(true);
            router.replace('/worldo');
            return;
          }
        }

        setCart(cartData.data);

        // 2. Busca saldo
        await fetchBalance();
        isInitialLoad.current = false;
      } catch (err) {
        console.error('Erro ao carregar checkout:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [router, fetchBalance]);

  const handleFinalize = async () => {
    if (!cart) return;

    if (userBalance < cart.total_price) {
      setError('Saldo insuficiente para completar a compra');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    const itemsToBuy = cart.items.map((item) => ({
      listing_id: item.listing_id,
      quantity: item.quantity,
      price: item.price,
    }));

    try {
      const res = await fetch('/api/cosmetics/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToBuy,
          total_price: cart.total_price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error_type === 'out_of_stock' || data.error?.includes('estoque')) {
          setError('Alguns itens estão indisponíveis. Voltando ao carrinho...');
          setTimeout(() => router.replace('/worldo/cosmetics/marketplace/cart'), 2000);
          return;
        }
        throw new Error(data.error || 'Erro ao finalizar compra');
      }

      setSuccess(true);
      await fetchBalance();
      await fetchSummary();

      setTimeout(() => {
        router.push('/worldo/cosmetics/orders/success');
      }, 1500);
    } catch (err) {
      console.error('Erro ao finalizar compra:', err);
      setError(err instanceof Error ? err.message : 'Erro ao finalizar compra');
    } finally {
      setSubmitting(false);
    }
  };

  const getItemConfig = (rarity: string | undefined) => {
    return rarityDesigns[rarity?.toUpperCase() || ''] || rarityDesigns.COMUM;
  };

  // UI consolidada para Loading e Redirecionamento
  if (loading || redirecting || !cart) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Carregando Checkout...
        </p>
      </div>
    );
  }

  const hasEnoughBalance = userBalance >= cart.total_price;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/worldo/cosmetics/marketplace/cart"
            className="text-slate-400 hover:text-slate-200 transition p-2 rounded-lg hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-200 flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-500" />
              Resumo da Compra
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Revise os itens antes de finalizar • {formatItemCount(cart.total_items)} unidades
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/worldo/cosmetics/marketplace/cart"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition text-slate-300 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
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
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Compra realizada com sucesso! Redirecionando...
          </span>
        </div>
      )}

      {/* Grid: Items + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const config = getItemConfig(item.frame?.rarity);
            const isOutOfStock = !item.in_stock || item.max_quantity === 0;

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all group border ${
                  isOutOfStock
                    ? 'border-red-500/30 opacity-60 grayscale-50'
                    : config.cardClass || 'border-slate-800 bg-slate-900/50'
                }`}
              >
                {!isOutOfStock && config.bgDecoration}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none z-0" />

                <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:items-center">
                  {/* Imagem + Badge */}
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
                    <div className="relative w-full flex justify-center z-20 -mt-3 h-6">
                      {config.badge}
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-lg sm:text-xl truncate block drop-shadow-md ${config.textClass}`}
                        >
                          {item.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate max-w-25 sm:max-w-37.5 font-medium">
                              {item.seller_name}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-slate-400 font-medium">{item.quantity}x</span>
                          {isOutOfStock && (
                            <span className="text-red-400 font-bold text-[10px] sm:text-xs bg-red-500/10 px-2 py-1 rounded-md">
                              Sem estoque
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="flex items-center gap-1.5 text-sm sm:text-base font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm shrink-0 mt-2 sm:mt-0">
                        <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
                      <span className="text-xs text-slate-400">
                        Total:{' '}
                        <span className="text-amber-400 font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </span>
                      <span className="hidden sm:inline-block text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
                        Estoque: {formatFullNumber(item.max_quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo */}
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
                  {formatItemCount(cart.total_items)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Produtos únicos</span>
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart.unique_items_count)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {formatPrice(cart.total_price)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Seu saldo</span>
                <span
                  className={`font-bold flex items-center gap-1 ${hasEnoughBalance ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  <Coins className="w-4 h-4" />
                  {formatPrice(userBalance)}
                </span>
              </div>

              <div className="flex justify-between py-3 text-lg">
                <span className="text-slate-400 font-bold">TOTAL</span>
                <span className="font-black text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-5 h-5" />
                  {formatPrice(cart.total_price)}
                </span>
              </div>
            </div>

            {/* Avisos */}
            {!hasEnoughBalance && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Saldo insuficiente. Você precisa de {formatPrice(
                    cart.total_price - userBalance,
                  )}{' '}
                  moedas a mais.
                </p>
              </div>
            )}

            {cart.items.some((item) => !item.in_stock || item.max_quantity === 0) && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Alguns itens estão sem estoque. Remova-os no carrinho.
                </p>
              </div>
            )}

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Ao finalizar, as moedas serão debitadas da sua carteira. Esta ação não pode ser
                  desfeita.
                </span>
              </p>
            </div>

            {/* Botões */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleFinalize}
                disabled={
                  submitting ||
                  !hasEnoughBalance ||
                  success ||
                  cart.items.some((item) => !item.in_stock || item.max_quantity === 0)
                }
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                  hasEnoughBalance &&
                  !cart.items.some((item) => !item.in_stock || item.max_quantity === 0)
                    ? 'bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20'
                    : 'bg-slate-800 text-slate-400 shadow-slate-900/20'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Compra realizada!
                  </>
                ) : !hasEnoughBalance ? (
                  <>
                    <Coins className="w-5 h-5" />
                    Saldo insuficiente
                  </>
                ) : cart.items.some((item) => !item.in_stock || item.max_quantity === 0) ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Itens indisponíveis
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Finalizar Compra - {formatPrice(cart.total_price)}
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 text-center font-medium">
              <Link
                href="/worldo/cosmetics/marketplace/cart"
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium py-3 rounded-xl hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao carrinho
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
