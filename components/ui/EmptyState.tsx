// components/ui/EmptyState.tsx
// Estado vazio padrão de listas: ícone, título, descrição e ação opcional em caixa tracejada.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Propriedades do estado vazio. */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/** Caixa centralizada indicando que não há itens para exibir. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
      <Icon className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
      <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
