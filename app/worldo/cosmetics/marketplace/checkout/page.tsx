// app/worldo/cosmetics/marketplace/checkout/page.tsx
// Página /worldo/cosmetics/marketplace/checkout: revisão final do carrinho e do saldo e
// finalização da compra.
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartDetail, useCoinBalance } from '@/hooks/queries/useWallet';
import {
  CartItemCard,
  ItemStatusTag,
  OrderPageHeader,
  isItemOutOfStock,
  type CartData,
} from '@/components/cart/CartItemCard';
import { invalidate } from '@/lib/invalidate';
import { formatItemCount, formatPrice } from '@/lib/format-utils';
import { ArrowLeft, Coins, AlertTriangle, CheckCircle2, Package, CreditCard } from 'lucide-react';
import { LoadingSpinner } from '@/components/Loading';
import { Spinner } from '@/components/ui/Spinner';
import { FeedbackMessage } from '@/components/ui/FeedbackMessage';
import { SummaryRow } from '@/components/ui/SummaryRow';

/**
 * Checkout com carrinho e saldo sempre buscados do servidor. Após a compra o carrinho deixa de
 * ser buscado para a tela não esvaziar antes do redirecionamento.
 */
export default function CheckoutPage() {
  const router = useRouter();

  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const balanceQuery = useCoinBalance();
  const cartQuery = useCartDetail<CartData>({ enabled: !success });
  const userBalance = balanceQuery.data ?? 0;
  const cart = cartQuery.data ?? null;
  const loading = cartQuery.isPending || balanceQuery.isPending;
  const error =
    actionError || (cartQuery.error ? cartQuery.error.message || 'Erro ao carregar dados' : '');

  const isInitialLoad = useRef(true);

  // Carrinho vazio na primeira carga redireciona para /worldo
  useEffect(() => {
    if (!cartQuery.isSuccess || !isInitialLoad.current) return;
    isInitialLoad.current = false;
    if (!cart || cart.items.length === 0) {
      setRedirecting(true);
      router.replace('/worldo');
    }
  }, [cartQuery.isSuccess, cart, router]);

  /**
   * Confere o saldo e envia a compra para /api/worldo/cosmetics/marketplace/checkout. Sem
   * estoque, volta ao carrinho; em sucesso invalida saldo, carrinho, listagens e inventário e
   * navega para /worldo/cosmetics/orders/success, rota que não existe no projeto.
   */
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
      const res = await fetch('/api/worldo/cosmetics/marketplace/checkout', {
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
      await invalidate.purchase(queryClient);

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

  // Carregando ou redirecionando
  if (loading || redirecting || !cart) {
    return <LoadingSpinner text="Carregando Checkout..." />;
  }

  const hasEnoughBalance = userBalance >= cart.total_price;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Cabeçalho */}
      <OrderPageHeader
        icon={Package}
        title="Resumo da Compra"
        subtitle={
          <>Revise os itens antes de finalizar • {formatItemCount(cart.total_items)} unidades</>
        }
        backHref="/worldo/cosmetics/marketplace/cart"
        actions={
          <Link
            href="/worldo/cosmetics/marketplace/cart"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition text-slate-300 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      {/* Alertas */}
      <FeedbackMessage type="error" message={error} className="mb-6" />

      {success && (
        <FeedbackMessage type="success" className="mb-6">
          Compra realizada com sucesso! Redirecionando...
        </FeedbackMessage>
      )}

      {/* Itens e resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              details={
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-400 font-medium">{item.quantity}x</span>
                  {isItemOutOfStock(item) && <ItemStatusTag tone="red">Sem estoque</ItemStatusTag>}
                </div>
              }
              footerStart={
                <span className="text-xs text-slate-400">
                  Total:{' '}
                  <span className="text-amber-400 font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </span>
              }
            />
          ))}
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-black text-slate-200 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Resumo
            </h2>

            <div className="space-y-3 text-sm">
              <SummaryRow label="Itens">
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart.total_items)}
                </span>
              </SummaryRow>
              <SummaryRow label="Produtos únicos">
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart.unique_items_count)}
                </span>
              </SummaryRow>
              <SummaryRow label="Subtotal">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {formatPrice(cart.total_price)}
                </span>
              </SummaryRow>

              <SummaryRow label="Seu saldo">
                <span
                  className={`font-bold flex items-center gap-1 ${hasEnoughBalance ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  <Coins className="w-4 h-4" />
                  {formatPrice(userBalance)}
                </span>
              </SummaryRow>

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
              <FeedbackMessage type="error" size="sm" className="mt-4">
                Saldo insuficiente. Você precisa de {formatPrice(cart.total_price - userBalance)}{' '}
                moedas a mais.
              </FeedbackMessage>
            )}

            {cart.items.some((item) => !item.in_stock || item.max_quantity === 0) && (
              <FeedbackMessage type="error" size="sm" className="mt-3">
                Alguns itens estão sem estoque. Remova-os no carrinho.
              </FeedbackMessage>
            )}

            <FeedbackMessage type="warning" size="sm" className="mt-4">
              Ao finalizar, as moedas serão debitadas da sua carteira. Esta ação não pode ser
              desfeita.
            </FeedbackMessage>

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
                    <Spinner size="sm" />
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
