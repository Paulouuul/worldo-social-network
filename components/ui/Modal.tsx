// components/ui/Modal.tsx
// Modal padrão: fundo escurecido com desfoque cobrindo a tela e painel central animado.

import type { ReactNode } from 'react';

/** Propriedades do modal. */
interface ModalProps {
  children: ReactNode;
  /** Largura máxima e demais classes do painel (ex.: max-w-sm p-6). */
  panelClassName?: string;
  /** Cor da borda do painel. */
  borderClassName?: string;
}

/** Fundo em tela cheia (fade) com o painel centralizado (zoom). */
export function Modal({
  children,
  panelClassName = 'max-w-md',
  borderClassName = 'border-slate-800',
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-slate-900 border rounded-2xl w-full shadow-2xl animate-zoom-in ${borderClassName} ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
