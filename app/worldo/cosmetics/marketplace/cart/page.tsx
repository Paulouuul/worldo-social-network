// app/worldo/cosmetics/marketplace/cart/page.tsx
// Página /worldo/cosmetics/marketplace/cart: carrinho de compras (backend Python) com alteração
// de quantidade, remoção, limpeza e validação antes do checkout.
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { backendApiCall } from '@/lib/api/backendApiClient';
import { useCartDetail } from '@/hooks/queries/useWallet';
import {
  CartItemCard,
  ItemStatusTag,
  OrderPageHeader,
  isItemOutOfStock,
  type CartData,
} from '@/components/cosmetics/cart/CartItemCard';
import { QuantityStepper } from '@/components/ui/forms/QuantityStepper';
import { invalidate } from '@/lib/query/invalidate';
import { formatItemCount, formatPrice } from '@/lib/utils/formatUtils';
import { LoadingSpinner } from '@/components/ui/feedback/Loading';
import {
  ShoppingCart,
  Coins,
  Trash2,
  ArrowLeft,
  Store,
  CreditCard,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Spinner } from '@/components/ui/feedback/Spinner';
import { FeedbackMessage } from '@/components/ui/feedback/FeedbackMessage';
import { Modal } from '@/components/ui/overlays/Modal';
import { buttonClass } from '@/components/ui/buttons/PrimaryButton';
import { SummaryRow } from '@/components/ui/dataDisplay/SummaryRow';

/**
 * Carrinho sempre buscado do servidor. Cada alteração invalida carrinho, resumo do Header e
 * quantidades por item; carrinho vazio na primeira carga redireciona para /worldo.
 */
export default function CartPage() {
  const router = useRouter();

  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isInitialLoad = useRef(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const cartQuery = useCartDetail<CartData>();
  const cart = cartQuery.data ?? null;
  const loading = cartQuery.isPending;
  const error = actionError || (cartQuery.error ? 'Erro ao carregar carrinho' : '');

  /** Recarrega carrinho, resumo do Header e quantidades por item. */
  const refreshCart = () => invalidate.cart(queryClient);

  // Carrinho vazio na primeira carga: volta para o início
  useEffect(() => {
    if (!cartQuery.isSuccess || !isInitialLoad.current) return;
    isInitialLoad.current = false;
    if (cart && cart.items.length === 0) {
      setRedirecting(true);
      router.replace('/worldo');
    }
  }, [cartQuery.isSuccess, cart, router]);

  /** Altera a quantidade do item (0 remove); mostra o máximo disponível quando excede o estoque. */
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
        if (errorDetail.max_quantity)
          setError(`Quantidade máxima disponível: ${errorDetail.max_quantity}`);
        else throw new Error(errorDetail.error || 'Erro ao atualizar quantidade');
        return;
      }

      await refreshCart();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar quantidade');
    }
  };

  /** Remove o item do carrinho. */
  const handleRemoveItem = async (itemId: string) => {
    setError('');
    try {
      const res = await backendApiCall(`/cosmetics/marketplace/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Erro ao remover item');

      await refreshCart();
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  /** Esvazia o carrinho. */
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

      await refreshCart();
      setSuccess('Carrinho esvaziado com sucesso!');
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao limpar carrinho');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  /** Valida o carrinho no backend e segue para o checkout; em erro, recarrega o carrinho. */
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
        await refreshCart();
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

  if (loading || redirecting) {
    return <LoadingSpinner text="Carregando Carrinho..." />;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Modal de confirmação para esvaziar */}
      {isClearModalOpen && (
        <Modal
          borderClassName="border-slate-700"
          panelClassName="p-6 max-w-sm flex flex-col items-center text-center"
        >
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
              className={`flex-1 ${buttonClass.secondary}`}
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
        </Modal>
      )}

      {/* Cabeçalho */}
      <OrderPageHeader
        icon={ShoppingCart}
        title="Meu Carrinho"
        subtitle={
          <>
            {formatItemCount(cart?.unique_items_count || 0)} item(ns) •{' '}
            {formatItemCount(cart?.total_items || 0)} unidades
          </>
        }
        actions={
          !isEmpty && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={submitting || isEmpty}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition text-red-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )
        }
      />

      {/* Alertas */}
      <FeedbackMessage type="error" message={error} className="mb-6" />

      <FeedbackMessage type="success" message={success} className="mb-6" />

      {/* Itens e resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de itens ou carrinho vazio */}
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
              const isOutOfStock = isItemOutOfStock(item);
              const isQuantityAdjusted = item.quantity > item.max_quantity;

              return (
                <CartItemCard
                  key={item.id}
                  item={item}
                  linkName
                  adjusted={isQuantityAdjusted}
                  details={
                    isOutOfStock ? (
                      <ItemStatusTag tone="red">Sem estoque</ItemStatusTag>
                    ) : (
                      isQuantityAdjusted && (
                        <ItemStatusTag tone="amber">Ajustado: {item.max_quantity} un</ItemStatusTag>
                      )
                    )
                  }
                  footerStart={
                    <QuantityStepper
                      value={item.quantity}
                      onDecrement={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      onIncrement={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      decrementDisabled={item.quantity <= 1 || submitting}
                      incrementDisabled={
                        item.quantity >= item.max_quantity || submitting || isOutOfStock
                      }
                    />
                  }
                  footerEnd={
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={submitting}
                      aria-label="Remover item do carrinho"
                      className="text-red-400 hover:text-red-300 transition p-2 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5 border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden text-xs font-semibold">Remover</span>
                    </button>
                  }
                />
              );
            })
          )}
        </div>

        {/* Resumo e botão de checkout */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-black text-slate-200 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Resumo
            </h2>

            <div className="space-y-3 text-sm">
              <SummaryRow label="Itens">
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart?.total_items || 0)}
                </span>
              </SummaryRow>
              <SummaryRow label="Produtos únicos">
                <span className="font-bold text-slate-200">
                  {formatItemCount(cart?.unique_items_count || 0)}
                </span>
              </SummaryRow>
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
              <FeedbackMessage type="error" size="sm" className="mt-4">
                Alguns itens estão sem estoque. Remova-os para continuar.
              </FeedbackMessage>
            )}

            {!isEmpty &&
              cart?.items.some((item) => item.quantity > item.max_quantity && item.in_stock) && (
                <FeedbackMessage type="warning" size="sm" className="mt-3">
                  Algumas quantidades foram ajustadas devido ao estoque disponível.
                </FeedbackMessage>
              )}

            <div className="mt-6 space-y-3">
              {!isEmpty && (
                <button
                  onClick={handleValidate}
                  disabled={submitting || isEmpty || cart?.items.some((item) => !item.in_stock)}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                >
                  {submitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Validar e ir para Checkout
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 text-center font-medium">
              <Link
                href="/worldo/cosmetics/marketplace"
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium py-3 rounded-xl hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
