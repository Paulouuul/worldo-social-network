// components/ui/buttons/PrimaryButton.tsx
// Botão principal de formulários (gradiente roxo → índigo) com estado de carregamento.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/feedback/Spinner';

/** Classes dos botões do app, para aplicar também em links (<Link>). */
export const buttonClass = {
  primary:
    'bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide',
  secondary:
    'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2',
};

/** Propriedades do botão; aceita todas as props de <button>. */
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: LucideIcon;
  /** Exibe spinner e `loadingText` no lugar do conteúdo. */
  loading?: boolean;
  loadingText?: string;
}

/** Botão em gradiente de largura total; fica desabilitado visualmente quando `disabled`. */
export function PrimaryButton({
  children,
  icon: Icon,
  loading = false,
  loadingText,
  className = '',
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  return (
    <button type={type} {...props} className={`w-full ${buttonClass.primary} ${className}`}>
      {loading ? (
        <>
          <Spinner />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
