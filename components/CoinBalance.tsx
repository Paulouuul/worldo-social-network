// components/CoinBalance.tsx
// Saldo de moedas no Header, com link para a loja de moedas; oculto sem sessão.
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Coins, Plus } from 'lucide-react';
import { useCoinBalance } from '@/hooks/queries/useWallet';
import { formatFullNumber } from '@/lib/format-utils';
/** Propriedades do saldo de moedas. */
interface CoinBalanceProps {
  onClick?: () => void;
}

/** Exibe o saldo atual de moedas formatado (pt-BR) e leva à página de compra de moedas. */
export function CoinBalance({ onClick }: CoinBalanceProps) {
  const { status } = useSession();
  const { data: balance = 0, isPending: isLoading } = useCoinBalance();

  // Sem sessão autenticada não renderiza
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  // Saldo com separador de milhar (ex.: 1500 → 1.500)
  const formattedBalance = formatFullNumber(balance ?? 0);

  return (
    <Link
      href="/worldo/coins"
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-slate-900/60 hover:bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 rounded-xl transition-all duration-300 group select-none backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
        {/* Efeito sutil de brilho no ícone */}
        <span className="absolute inset-0 bg-amber-400/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {isLoading && balance === 0 ? (
        // Esqueleto na primeira carga do saldo
        <div className="w-8 h-4 bg-purple-500/20 animate-pulse rounded" />
      ) : (
        <span className="font-bold text-sm text-slate-100 tracking-wide">{formattedBalance}</span>
      )}

      <div className="bg-purple-500/10 p-0.5 rounded-md border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
        <Plus className="w-3 h-3 text-purple-400" />
      </div>
    </Link>
  );
}
