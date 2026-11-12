// components/ui/FormField.tsx
// Peças padrão de formulário: label com ícone e contador, mensagem de erro do campo e campos de
// texto (input/textarea) com estados normal e de erro.

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

/** Tamanho do label: `sm` em formulários compactos (login, cadastro, perfil), `md` em formulários amplos. */
type FieldSize = 'sm' | 'md';

const LABEL_SIZES: Record<FieldSize, { label: string; icon: string; counter: string; mb: string }> =
  {
    sm: { label: 'gap-1.5 text-xs', icon: 'w-3.5 h-3.5', counter: 'text-[10px]', mb: 'mb-1.5' },
    md: { label: 'gap-2 text-sm', icon: 'w-4 h-4', counter: 'text-xs', mb: 'mb-2' },
  };

/** Propriedades do label de campo. */
interface FieldLabelProps {
  children: ReactNode;
  icon?: LucideIcon;
  /** Cor do ícone (padrão: roxo do app). */
  iconClassName?: string;
  size?: FieldSize;
  /** Espaço maior abaixo do label, para blocos com conteúdo visual (imagens, grades). */
  loose?: boolean;
  /** Contador de caracteres exibido à direita. */
  counter?: { value: number; max: number };
  htmlFor?: string;
}

/** Label em caixa alta com ícone opcional e contador de caracteres. */
export function FieldLabel({
  children,
  icon: Icon,
  iconClassName = 'text-purple-400',
  size = 'sm',
  loose = false,
  counter,
  htmlFor,
}: FieldLabelProps) {
  const s = LABEL_SIZES[size];
  return (
    <label
      htmlFor={htmlFor}
      className={`flex items-center text-slate-300 font-semibold tracking-wide uppercase ${s.label} ${
        loose ? 'mb-3' : s.mb
      }`}
    >
      {Icon && <Icon className={`${s.icon} ${iconClassName}`} />}
      {children}
      {counter && (
        <span className={`text-slate-500 font-normal ml-auto ${s.counter}`}>
          {counter.value}/{counter.max}
        </span>
      )}
    </label>
  );
}

/** Mensagem de erro exibida abaixo do campo; não renderiza nada sem mensagem. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      {message}
    </p>
  );
}

const FIELD_BASE =
  'w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all';
const FIELD_ERROR = 'border-red-500/50 focus:ring-red-500/50';
const FIELD_FOCUS = 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30';

/** Estado visual comum a input e textarea. */
interface FieldStateProps {
  hasError?: boolean;
  /** Classes de foco no lugar do roxo padrão (ex.: cor da raridade). */
  focusClassName?: string;
}

/** Classes do campo conforme o estado de erro e a cor de foco. */
function fieldClass({ hasError, focusClassName }: FieldStateProps, extra = '') {
  const state = hasError ? FIELD_ERROR : `border-slate-800 ${focusClassName ?? FIELD_FOCUS}`;
  return `${FIELD_BASE} ${state} ${extra}`;
}

/** Input de texto padrão; aceita todas as props de <input>. */
export function TextInput({
  hasError,
  focusClassName,
  className = '',
  ...props
}: FieldStateProps & InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClass({ hasError, focusClassName }, className)} />;
}

/** Textarea padrão (sem redimensionamento); aceita todas as props de <textarea>. */
export function TextArea({
  hasError,
  focusClassName,
  className = '',
  ...props
}: FieldStateProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={fieldClass({ hasError, focusClassName }, `resize-none ${className}`)}
    />
  );
}

/** Select padrão; aceita todas as props de <select>. */
export function SelectInput({
  hasError,
  focusClassName,
  className = '',
  ...props
}: FieldStateProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldClass({ hasError, focusClassName }, className)} />;
}
