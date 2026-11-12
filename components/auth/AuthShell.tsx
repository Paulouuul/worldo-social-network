// components/auth/AuthShell.tsx
// Moldura das telas de autenticação (login e cadastro): fundo com brilho, card central com logo,
// título em gradiente, subtítulo e link de rodapé.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ClientImage } from '@/components/ClientImage';

/** Propriedades da moldura de autenticação. */
interface AuthShellProps {
  title: string;
  subtitle: string;
  /** Mostra o ícone de brilho também à direita do título. */
  symmetricTitle?: boolean;
  /** Texto e link do rodapé (ex.: "Não tem uma conta?" → Registre-se). */
  footerText: string;
  footerLink: { href: string; label: ReactNode };
  children: ReactNode;
}

/** Card centralizado das telas de login e cadastro. */
export function AuthShell({
  title,
  subtitle,
  symmetricTitle = false,
  footerText,
  footerLink,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-950 relative overflow-hidden">
      <div className="glow-backdrop" />
      <div className="hairline-top" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        {/* Logo e título */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-48 h-16 mb-4">
            <ClientImage
              src="/worldo_logo.png"
              alt="Logo Worldo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-indigo-400 flex items-center gap-2 tracking-wide uppercase">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            {title}
            {symmetricTitle && <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />}
          </h1>
          <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
        </div>

        {children}

        {/* Rodapé */}
        <p className="text-center text-slate-400 mt-6 text-xs tracking-wide">
          {footerText}{' '}
          <Link
            href={footerLink.href}
            className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 group transition-colors"
          >
            {footerLink.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
