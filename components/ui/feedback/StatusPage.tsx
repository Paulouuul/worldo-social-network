// components/ui/feedback/StatusPage.tsx
// Página de status em tela cheia (ex.: erro de login, pagamento cancelado): fundo escuro com dois
// brilhos desfocados e um card de vidro central.

import type { ReactNode } from 'react';

/** Propriedades da página de status. */
interface StatusPageProps {
  children: ReactNode;
  /** Cor do brilho central (ex.: bg-red-600/10). */
  glowClassName: string;
}

/** Fundo da página de status com o conteúdo centralizado. */
export function StatusPage({ children, glowClassName }: StatusPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative antialiased selection:bg-purple-500/30 bg-[#020617]">
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full blur-[120px] pointer-events-none z-0 ${glowClassName}`}
      />
      <div className="fixed top-1/3 right-1/4 w-75 h-75 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
      {children}
    </div>
  );
}

/** Card de vidro central da página de status. */
export function StatusCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative z-10 w-full max-w-md bg-slate-900/50 border border-white/6 rounded-2xl p-8 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] ${className}`}
    >
      {children}
    </div>
  );
}
