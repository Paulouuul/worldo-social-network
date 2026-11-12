// components/ui/buttons/ChipButton.tsx
// Botão em formato de chip usado em filtros e ordenações (estado ativo/inativo).

import type { ReactNode } from 'react';

/** Tamanhos: `md` para filtros principais, `sm` para opções secundárias (ex.: ordenação). */
type ChipSize = 'sm' | 'md';

const SIZES: Record<ChipSize, { base: string; active: string; inactive: string }> = {
  md: {
    base: 'px-3 py-2.5 rounded-xl text-xs',
    active: 'bg-purple-600 text-white shadow-lg shadow-purple-900/30',
    inactive: 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200',
  },
  sm: {
    base: 'px-3 py-1.5 rounded-lg text-[11px]',
    active: 'bg-slate-700 text-white',
    inactive: 'bg-slate-800 text-slate-500 hover:text-slate-300',
  },
};

/** Propriedades do chip. */
interface ChipButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: ChipSize;
}

/** Chip clicável que destaca a opção selecionada. */
export function ChipButton({ active, onClick, children, size = 'md' }: ChipButtonProps) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${s.base} font-bold transition-all whitespace-nowrap ${
        active ? s.active : s.inactive
      }`}
    >
      {children}
    </button>
  );
}
