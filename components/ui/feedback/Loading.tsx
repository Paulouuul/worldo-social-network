// components/ui/feedback/Loading.tsx
// Indicadores de carregamento: spinner de página e indicador de "carregando mais".

import { Spinner } from '@/components/ui/feedback/Spinner';

/** Propriedades do spinner de página. */
interface LoadingSpinnerProps {
  text?: string;
  withBackground?: boolean;
  fullScreen?: boolean;
  /** Altura mínima quando não é tela cheia (padrão: 60% da altura da tela). */
  minHeightClass?: string;
}

/** Spinner centralizado com texto, opcionalmente com fundo e em tela cheia. */
export function LoadingSpinner({
  text = 'Carregando...',
  withBackground = false,
  fullScreen = false,
  minHeightClass = 'min-h-[60vh]',
}: LoadingSpinnerProps) {
  const heightClass = fullScreen ? 'min-h-screen' : minHeightClass;

  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center text-slate-400 ${
        withBackground ? 'bg-slate-950' : ''
      }`}
    >
      <Spinner size="lg" className="text-purple-500 mb-4" />
      <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">{text}</p>
    </div>
  );
}

/** Propriedades do indicador de "carregando mais". */
interface LoadingMoreProps {
  text?: string;
}

/** Spinner pequeno com texto opcional, usado ao carregar mais itens. */
export function LoadingMore({ text }: LoadingMoreProps) {
  return (
    <div className="flex justify-center py-8">
      <Spinner size="md" className="text-purple-500" />
      {text && <span className="ml-2 text-slate-400">{text}</span>}
    </div>
  );
}
