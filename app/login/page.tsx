'use client';

import { Suspense, useState, useEffect } from 'react';
import { ClientImage } from '@/components/ClientImage';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccess('Email verificado! Agora você pode fazer login.');
    }

    const errorParam = searchParams.get('error');
    if (errorParam === 'CredentialsSignin') {
      setError('Email ou senha inválidos');
    } else if (errorParam === 'OAuthAccountNotLinked') {
      setError(
        'Este e-mail já está cadastrado usando outro método (Google, GitHub ou E-mail/Senha). Por segurança, conecte-se utilizando a mesma forma com que você criou a sua conta.',
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (
          result.error.includes('verifique seu email') ||
          result.error.includes('Verifique seu email')
        ) {
          setError('Por favor, verifique seu email antes de fazer login');
        } else if (result.error.includes('Usuário não encontrado')) {
          setError('Email não encontrado. Verifique ou registre-se.');
        } else if (result.error.includes('Senha inválida')) {
          setError('Senha incorreta. Tente novamente.');
        } else {
          setError('Email ou senha inválidos');
        }
        setLoading(false);
      } else {
        router.push('/worldo');
      }
    } catch (_err) {
      setError('Erro ao conectar com o servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-950 relative overflow-hidden">
      {/* Background Aurora / Efeito de Fundo Cósmico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        {/* Espaço para a Logo / Header */}
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
            Bem-Vindo ao Worldo
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 text-xs mt-1">Informe seu login e senha</p>
        </div>

        {/* Alertas de Erro */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-xs border border-red-500/20 flex items-center gap-2">
            {error}
          </div>
        )}

        {/* Alertas de Sucesso */}
        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-4 text-xs border border-emerald-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0" />
            {success}
          </div>
        )}

        {/* Formulário de Credenciais */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
              required
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        {/* Divisor de Provedores Sociais */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-800/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-slate-900/90 px-3 text-slate-500 font-medium">Ou continue com</span>
          </div>
        </div>

        {/* Provedores OAuth com SVG customizado */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/worldo' })}
            className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2.5 px-4 rounded-xl transition text-xs font-semibold"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <button
            onClick={() => signIn('github', { callbackUrl: '/worldo' })}
            className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2.5 px-4 rounded-xl transition text-xs font-semibold"
          >
            <svg
              className="w-4 h-4 fill-current text-slate-400"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Link de Registro */}
        <p className="text-center text-slate-400 mt-6 text-xs tracking-wide">
          Não tem uma conta?{' '}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-0.5 group transition-colors"
          >
            Registre-se{' '}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 mt-4 text-purple-300 font-medium text-sm">
            Carregando portal...
          </span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
