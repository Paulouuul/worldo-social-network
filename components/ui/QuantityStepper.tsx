// components/ui/QuantityStepper.tsx
// Seletor de quantidade com botões de diminuir e aumentar.

import { Minus, Plus } from 'lucide-react';

/** Tamanhos: `sm` compacto (itens do carrinho), `lg` em barra (compra no anúncio). */
type StepperSize = 'sm' | 'lg';

const SIZES: Record<StepperSize, { wrap: string; button: string; value: string; icon: string }> = {
  sm: {
    wrap: 'flex items-center gap-2',
    button:
      'w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 transition flex items-center justify-center text-slate-300 border border-slate-700 backdrop-blur-sm',
    value: 'w-8 sm:w-12 text-center font-bold text-slate-200 text-sm',
    icon: 'w-3 h-3 sm:w-4 sm:h-4',
  },
  lg: {
    wrap: 'flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner h-14',
    button:
      'w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors',
    value: 'font-black text-lg text-slate-200 w-12 text-center',
    icon: 'w-4 h-4',
  },
};

/** Propriedades do seletor de quantidade. */
interface QuantityStepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  size?: StepperSize;
}

/** Botão "-", valor atual e botão "+". */
export function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  decrementDisabled = false,
  incrementDisabled = false,
  size = 'sm',
}: QuantityStepperProps) {
  const s = SIZES[size];
  return (
    <div className={s.wrap}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={decrementDisabled}
        aria-label="Diminuir quantidade"
        className={s.button}
      >
        <Minus className={s.icon} />
      </button>
      <span className={s.value}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={incrementDisabled}
        aria-label="Aumentar quantidade"
        className={s.button}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
