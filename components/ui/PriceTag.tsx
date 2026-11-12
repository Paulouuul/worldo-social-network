// components/ui/PriceTag.tsx
// Etiquetas sobre cards de cosméticos: preço em moedas (âmbar) e quantidade disponível (escura).

import { Coins } from 'lucide-react';
import { formatItemCount, formatPrice } from '@/lib/format-utils';

/** Tamanhos: `sm` compacto em cards (ex.: 1.5K), `lg` com valor completo (ex.: 1.500 Moedas). */
type TagSize = 'sm' | 'lg';

const PRICE_SIZES: Record<TagSize, { box: string; icon: string }> = {
  sm: { box: 'gap-1 text-[10px] px-2 py-1 rounded-md', icon: 'w-3 h-3' },
  lg: { box: 'gap-1.5 text-sm sm:text-base px-3 py-1.5 rounded-lg', icon: 'w-4 h-4 sm:w-5 sm:h-5' },
};

/** Propriedades da etiqueta de preço. */
interface PriceTagProps {
  value: number;
  size?: TagSize;
  className?: string;
}

/** Preço em moedas com ícone; `sm` usa formato compacto e `lg` o valor completo. */
export function PriceTag({ value, size = 'sm', className = '' }: PriceTagProps) {
  const s = PRICE_SIZES[size];
  return (
    <span
      className={`flex items-center font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm shrink-0 ${s.box} ${className}`}
    >
      <Coins className={s.icon} />
      {size === 'sm' ? formatItemCount(value) : formatPrice(value)}
    </span>
  );
}

/** Quantidade em formato compacto (ex.: x1.5K) em etiqueta escura. */
export function QuantityTag({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span
      className={`bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 font-black text-[10px] px-2 py-1 rounded-md shadow-lg shrink-0 ${className}`}
    >
      x{formatItemCount(value)}
    </span>
  );
}
