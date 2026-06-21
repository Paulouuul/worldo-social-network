'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartSummaryStore } from '@/stores/cartSummaryStore';

interface CartBadgeProps {
  onClick?: () => void;
}

export function CartBadge({ onClick }: CartBadgeProps) {
  const { status } = useSession();
  const { summary, isLoading, fetchSummary } = useCartSummaryStore();

  // Renderização do componente

  // Buscar resumo do carrinho quando autenticar
  useEffect(() => {
    
    if (status === 'authenticated') {
      fetchSummary();

      // Atualizar a cada 30 segundos (estoque pode mudar)
      const interval = setInterval(() => {
        fetchSummary();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [status, fetchSummary]);

  // Se o NextAuth ainda está checando ou o usuário não está logado, não renderiza nada
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  const totalItems = summary?.total_items || 0;

  return (
    <Link
      href="/worldo/cosmetics/marketplace/cart"
      onClick={onClick}
      className="relative inline-flex items-center gap-2 bg-slate-900/60 hover:bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 rounded-xl transition-all duration-300 group select-none backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        <ShoppingCart className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
        {/* Efeito sutil de brilho no ícone */}
        <span className="absolute inset-0 bg-purple-400/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {isLoading && totalItems === 0 ? (
        // Shimmer/Skeleton loading
        <div className="w-4 h-4 bg-purple-500/20 animate-pulse rounded" />
      ) : (
        <span className="font-bold text-sm text-slate-100 tracking-wide">
          {totalItems > 0 ? totalItems : '0'}
        </span>
      )}

      {/* Indicador visual de itens no carrinho */}
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-purple-900/30 border border-purple-400/30">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}