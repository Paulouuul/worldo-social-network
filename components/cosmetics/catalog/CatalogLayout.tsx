// components/cosmetics/catalog/CatalogLayout.tsx
// Estrutura das páginas de catálogo (marketplace, inventário, loja do vendedor): cabeçalho e
// filtros fixos no topo e a grade ocupando o restante da tela com rolagem própria.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Propriedades do layout de catálogo. */
interface CatalogLayoutProps {
  /** Cabeçalho, filtros e demais blocos acima da grade. */
  top: ReactNode;
  /** Grade de itens (rola dentro da área restante). */
  children: ReactNode;
  /** Conteúdo fora do fluxo, como modais. */
  overlay?: ReactNode;
}

/** Página de catálogo em altura de tela, com a grade rolando abaixo do topo fixo. */
export function CatalogLayout({ top, children, overlay }: CatalogLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 flex flex-col h-screen overflow-hidden">
      {top}
      <div className="flex-1 min-h-0">{children}</div>
      {overlay}
    </div>
  );
}

/** Propriedades do cabeçalho de catálogo. */
interface CatalogHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Gradiente do título (classes from-/via-/to-). */
  gradientClassName?: string;
  /** Ação à direita (ex.: link para outra página). */
  action?: ReactNode;
}

/** Título com ícone e gradiente, subtítulo e ação opcional, separados da página por uma borda. */
export function CatalogHeader({
  icon: Icon,
  title,
  subtitle,
  gradientClassName = 'from-purple-400 to-pink-400',
  action,
}: CatalogHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-800/60 shrink-0">
      <div>
        <h1
          className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r tracking-wide flex items-center gap-3 uppercase ${gradientClassName}`}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 shrink-0" />
          {title}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/** Classes dos botões de ação do cabeçalho de catálogo. */
export const catalogActionClass = {
  neutral:
    'w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 transition border border-slate-700 hover:border-purple-500/50 text-slate-200 py-3 sm:py-2.5 px-5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/10',
  accent:
    'w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-300 py-3 sm:py-2.5 px-5 rounded-xl transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold shadow-lg shadow-purple-900/10',
};
