// components/ui/dataDisplay/SummaryRow.tsx
// Linha de resumo "rótulo ... valor" usada em resumos de compra e de venda.

import type { ReactNode } from 'react';

/** Propriedades da linha de resumo. */
interface SummaryRowProps {
  label: ReactNode;
  children: ReactNode;
  /** `total` destaca a linha final do resumo (borda acima, rótulo em destaque). */
  variant?: 'item' | 'total';
}

/** Rótulo à esquerda e valor à direita, separados por borda. */
export function SummaryRow({ label, children, variant = 'item' }: SummaryRowProps) {
  if (variant === 'total') {
    return (
      <div className="flex justify-between text-sm border-t border-slate-700/50 pt-2">
        <span className="text-slate-300 font-semibold">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="flex justify-between py-2 border-b border-slate-800/50">
      <span className="text-slate-400">{label}</span>
      {children}
    </div>
  );
}
