// components/layout/header/CartBadge.tsx
// Atalho do carrinho no Header com a quantidade de unidades; oculto sem sessão ou com carrinho
// vazio.
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartSummary } from '@/hooks/queries/useWallet';

/** Propriedades do atalho do carrinho. */
interface CartBadgeProps {
  onClick?: () => void;
}

/** Link para o carrinho exibindo o total de unidades do resumo do carrinho. */
export function CartBadge({ onClick }: CartBadgeProps) {
  const { status } = useSession();
  const { data: summary, isPending: isLoading } = useCartSummary();

  // Sem sessão autenticada não renderiza
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  const totalItems = summary?.total_items || 0;
  if (totalItems === 0) {
    return null;
  }

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

      {isLoading ? (
        // Esqueleto enquanto o resumo carrega
        <div className="w-4 h-4 bg-purple-500/20 animate-pulse rounded" />
      ) : (
        <span className="font-bold text-sm text-slate-100 tracking-wide">{totalItems}</span>
      )}
    </Link>
  );
}
