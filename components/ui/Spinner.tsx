// components/ui/Spinner.tsx
// Ícone de carregamento giratório padrão do app.

import { Loader2 } from 'lucide-react';

/** Tamanhos disponíveis do spinner. */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<SpinnerSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/** Propriedades do spinner. A cor segue a cor do texto (currentColor) salvo se `className` definir outra. */
interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

/** Spinner giratório; usado em botões (xs/sm) e indicadores de carregamento (md a xl). */
export function Spinner({ size = 'xs', className = '' }: SpinnerProps) {
  return <Loader2 aria-hidden className={`${SIZES[size]} animate-spin shrink-0 ${className}`} />;
}
