'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { backendApiCall } from '@/lib/backendApiClient';
import { useCartSummaryStore } from '@/stores/cartSummaryStore';
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
  RefreshCw,
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

const rarityDesigns = getRarityDesigns('static');

export default function CartPage() {
  const { status } = useSession();
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  const { fetchSummary } = useCartSummaryStore();

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  
  // Buscar carrinho
  const fetchCart = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Erro ao buscar carrinho');
      }

      setCart(data.data);
    } catch (err) {
      console.error('Erro ao buscar carrinho:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar carrinho');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Sincronizar carrinho manualmente
  const handleSync = async () => {
    setSyncing(true);
    setError('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Erro ao sincronizar');
      }

      setSuccess('Carrinho sincronizado com sucesso!');
      await fetchCart(false);
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar carrinho');
    } finally {
      setSyncing(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Atualizar quantidade
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
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.max_quantity) {
          setError(`Quantidade máxima disponível: ${data.max_quantity}`);
        } else {
          throw new Error(data.detail || data.error || 'Erro ao atualizar quantidade');
        }
        return;
      }

      await fetchCart(false);
      await fetchSummary();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar quantidade');
    }
  };

  // Remover item
  const handleRemoveItem = async (itemId: string) => {
    setError('');
    
    try {
      const res = await backendApiCall(
        `/cosmetics/marketplace/cart/remove/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Erro ao remover item');
      }
      await fetchCart(false);
      await fetchSummary();
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  // Limpar carrinho
  const handleClearCart = async () => {
    if (!confirm('Tem certeza que deseja esvaziar o carrinho?')) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Erro ao limpar carrinho');
      }

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

  // Validar carrinho
  const handleValidate = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await backendApiCall('/cosmetics/marketplace/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((e: any) => e.message).join('\n');
          setError(`❌ ${errorMessages}`);
        } else {
          setError(data.detail || data.message || 'Erro ao validar carrinho');
        }
        await fetchCart(false);
        return;
      }

      setSuccess('Carrinho validado com sucesso!');
      await fetchSummary();
      
      setTimeout(() => {
        router.push('/worldo/cosmetics/checkout');
      }, 1500);
      
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Carregando Carrinho...
        </p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-32 h-32 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6">
            <ShoppingCart className="w-16 h-16 text-slate-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-200 mb-3">
            Seu carrinho está vazio
          </h2>
          <p className="text-slate-400 max-w-md mb-8">
            Explore o marketplace e adicione molduras incríveis ao seu carrinho!
          </p>
          <Link
            href="/worldo/cosmetics/marketplace"
            className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
          >
            <Store className="w-5 h-5" />
            Explorar Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const getItemConfig = (rarity: string | undefined) => {
    return rarityDesigns[rarity?.toUpperCase() || ''] || rarityDesigns.COMUM;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-200 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-purple-500" />
            Meu Carrinho
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {cart.unique_items_count} item(ns) • {cart.total_items} unidades
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition text-slate-300 text-sm font-semibold disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar
          </button>
          <button
            onClick={handleClearCart}
            disabled={submitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition text-red-400 text-sm font-semibold disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 flex items-start gap-3 transition-opacity duration-300">
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
        
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const config = getItemConfig(item.frame?.rarity);
            const isOutOfStock = !item.in_stock || item.max_quantity === 0;
            const isQuantityAdjusted = item.quantity > item.max_quantity;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/50 border rounded-2xl p-4 sm:p-5 transition-all ${
                  isOutOfStock
                    ? 'border-red-500/30 opacity-60'
                    : isQuantityAdjusted
                    ? 'border-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Alterado para flex-row para garantir o alinhamento lateral no mobile */}
                <div className="flex flex-row gap-4 sm:items-center">
                  
                  {/* Imagem (Agora quadrada de forma consistente) */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/90 flex items-center justify-center shrink-0">
                    <ClientImage
                      src={item.thumbnail_url || item.image_url}
                      alt={item.name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/worldo/cosmetics/marketplace/${item.listing_id}`}
                          className={`font-bold text-base sm:text-lg hover:underline transition truncate block ${config.textClass}`}
                        >
                          {item.name}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-25 sm:max-w-37.5">{item.seller_name}</span>
                          </span>
                          {item.frame?.rarity && (
                            <span className={`font-bold ${config.textClass}`}>
                              {item.frame.rarity}
                            </span>
                          )}
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
                      
                      <span className="text-amber-400 font-black text-base sm:text-lg flex items-center gap-1 shrink-0 mt-1 sm:mt-0">
                        <Coins className="w-4 h-4" />
                        {item.price}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || submitting}
                          aria-label="Diminuir quantidade"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-8 sm:w-12 text-center font-bold text-slate-200 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.max_quantity || submitting || isOutOfStock}
                          aria-label="Aumentar quantidade"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block text-xs text-slate-500">
                          Estoque: {item.max_quantity}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={submitting}
                          aria-label="Remover item do carrinho"
                          className="text-red-400 hover:text-red-300 transition p-1.5 rounded-lg hover:bg-red-500/10 flex items-center gap-1"
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
          })}
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
                <span className="font-bold text-slate-200">{cart.total_items}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Produtos únicos</span>
                <span className="font-bold text-slate-200">{cart.unique_items_count}</span>
              </div>
              <div className="flex justify-between py-3 text-lg">
                <span className="text-slate-400 font-bold">Total</span>
                <span className="font-black text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-5 h-5" />
                  {cart.total_price}
                </span>
              </div>
            </div>

            {/* Avisos */}
            {cart.items.some((item) => !item.in_stock || item.max_quantity === 0) && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <span>Alguns itens estão sem estoque. Remova-os para continuar.</span>
              </div>
            )}

            {cart.items.some((item) => item.quantity > item.max_quantity && item.in_stock) && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2">
                <span>Algumas quantidades foram ajustadas devido ao estoque disponível.</span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleValidate}
                disabled={submitting || cart.items.some((item) => !item.in_stock)}
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

              <Link
                href="/worldo/cosmetics/marketplace"
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition font-medium py-3 rounded-xl hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Continuar comprando
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 text-center font-medium">
              Última atualização: {new Date(cart.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}