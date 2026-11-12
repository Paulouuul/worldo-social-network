// components/ui/feedback/FeedbackMessage.tsx
// Mensagem de feedback padrão do app (sucesso, erro, aviso ou informação): mesma cor, ícone e
// fonte para cada tipo em todas as telas.

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

/** Tipos de mensagem suportados. */
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

/** Tamanhos: `md` para avisos de página, `sm` para avisos dentro de formulários e painéis. */
export type FeedbackSize = 'sm' | 'md';

/** Cores e ícone de cada tipo de mensagem. */
const VARIANTS: Record<FeedbackType, { box: string; icon: typeof Info }> = {
  success: { box: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  error: { box: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle },
  warning: { box: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  info: { box: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Info },
};

/** Espaçamento, fonte e ícone de cada tamanho. */
const SIZES: Record<FeedbackSize, { box: string; icon: string }> = {
  sm: { box: 'p-3 gap-2 text-xs', icon: 'w-4 h-4' },
  md: { box: 'p-4 gap-3 text-sm', icon: 'w-5 h-5' },
};

/** Propriedades da mensagem. O conteúdo vem de `message` ou de `children`. */
interface FeedbackMessageProps {
  type: FeedbackType;
  message?: ReactNode;
  children?: ReactNode;
  size?: FeedbackSize;
  className?: string;
  onDismiss?: () => void;
}

/** Renderiza a mensagem com cor e ícone do tipo; não renderiza nada sem conteúdo. */
export function FeedbackMessage({
  type,
  message,
  children,
  size = 'md',
  className = '',
  onDismiss,
}: FeedbackMessageProps) {
  const content = message ?? children;
  if (!content) return null;

  const variant = VARIANTS[type];
  const sizing = SIZES[size];
  const Icon = variant.icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start border rounded-xl font-medium ${variant.box} ${sizing.box} ${className}`}
    >
      <Icon className={`${sizing.icon} shrink-0 mt-0.5`} />
      <div className="flex-1 leading-relaxed whitespace-pre-line">{content}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar mensagem"
          className="opacity-50 hover:opacity-100 transition"
        >
          <X className={sizing.icon} />
        </button>
      )}
    </div>
  );
}
