// app/auth/error/page.tsx
// Página /auth/error: mensagem amigável para erros de login do NextAuth (?error=...).
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClientImage } from '@/components/ui/media/ClientImage';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, LifeBuoy } from 'lucide-react';
import { StatusCard, StatusPage } from '@/components/ui/feedback/StatusPage';

/** Conteúdo da página de erro; lê o código de erro da URL. */
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  /** Mensagem exibida para cada código de erro do NextAuth. */
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou senha inválidos. Tente novamente.';
      case 'VerificationRequired':
        return 'Por favor, verifique seu email antes de fazer login.';
      case 'AccessDenied':
        return 'Você não tem permissão para acessar esta área.';
      case 'Configuration':
        return 'Erro de configuração interna do servidor.';
      default:
        return 'Ocorreu um erro inesperado ao fazer login. Tente novamente.';
    }
  };

  return (
    <StatusCard>
      {/* Logo */}
      <div className="flex justify-center mb-8 pb-6 border-b border-white/[0.04]">
        <ClientImage
          src="/worldo_social_network_card.png"
          alt="Logo"
          width={240}
          height={86}
          className="object-contain drop-shadow-md"
          priority
          draggable={false}
        />
      </div>

      {/* Container do Erro */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 flex flex-col items-center gap-3 text-center backdrop-blur-sm shadow-inner">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-1 relative">
          <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md animate-pulse" />
          <AlertCircle className="w-6 h-6 text-red-400 relative z-10" />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-red-400 mb-1.5">
            Falha na Autenticação
          </h1>
          <p className="text-sm font-medium text-red-300/80 leading-relaxed px-2">
            {getErrorMessage(error || '')}
          </p>
        </div>
      </div>

      {/* Ações */}
      <Link
        href="/login"
        className="mt-8 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide bg-slate-800/80 border border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-600/10 text-slate-200 hover:text-purple-300 transition-all duration-300 shadow-lg active:scale-[0.98]"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Voltar para o Login
      </Link>

      {/* Rodapé de suporte */}
      <div className="mt-6 pt-6 border-t border-white/[0.04] text-center">
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Precisa de ajuda? Contate o suporte</span>
        </Link>
      </div>
    </StatusCard>
  );
}

/** Esqueleto exibido enquanto os parâmetros da URL carregam. */
function AuthErrorSkeleton() {
  return (
    <StatusCard>
      <div className="flex justify-center mb-8 pb-6 border-b border-white/[0.04]">
        <div className="w-[172px] h-[62px] bg-slate-800/50 rounded-lg animate-pulse" />
      </div>

      <div className="bg-slate-800/30 border border-white/[0.02] rounded-xl p-5 flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-800/80" />
        <div className="w-3/4 h-5 bg-slate-800/80 rounded" />
        <div className="w-full h-4 bg-slate-800/50 rounded" />
      </div>

      <div className="mt-8 w-full h-12 bg-slate-800/50 rounded-xl animate-pulse" />

      <div className="mt-6 pt-6 border-t border-white/[0.04] flex justify-center">
        <div className="w-1/2 h-4 bg-slate-800/50 rounded animate-pulse" />
      </div>
    </StatusCard>
  );
}

/** Página de erro com fundo decorativo e Suspense para o useSearchParams. */
export default function AuthErrorPage() {
  return (
    <StatusPage glowClassName="bg-red-600/10">
      <Suspense fallback={<AuthErrorSkeleton />}>
        <AuthErrorContent />
      </Suspense>
    </StatusPage>
  );
}
