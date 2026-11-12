// components/ui/navigation/Breadcrumb.tsx
// Trilha de navegação "Marketplace › item atual" usada nas páginas de detalhe.

import Link from 'next/link';
import { ChevronRight, Store } from 'lucide-react';

/** Propriedades da trilha. */
interface BreadcrumbProps {
  /** Texto da página atual. */
  current: string;
  /** Cor do texto da página atual (ex.: cor da raridade). */
  currentClassName?: string;
}

/** Link para o marketplace seguido do nome da página atual (truncado). */
export function Breadcrumb({ current, currentClassName = 'text-slate-300' }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 sm:mb-6 uppercase tracking-wider shrink-0 min-w-0">
      <Link
        href="/worldo/cosmetics/marketplace"
        className="hover:text-purple-400 transition flex items-center gap-1 shrink-0"
      >
        <Store className="w-3.5 h-3.5" /> Marketplace
      </Link>
      <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
      <span className={`truncate ${currentClassName}`} title={current}>
        {current}
      </span>
    </nav>
  );
}
