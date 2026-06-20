'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { useSession } from 'next-auth/react';
import { Sparkles, User, AtSign, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  useSession();

  const validatePassword = (pass: string) => {
    const errors = [];

    if (pass.length < 6) {
      errors.push('pelo menos 6 caracteres');
    }
    if (pass.length > 50) {
      errors.push('no máximo 50 caracteres');
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('pelo menos 1 letra maiúscula');
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('pelo menos 1 letra minúscula');
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('pelo menos 1 número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('pelo menos 1 caractere especial (!@#$%^&*)');
    }

    return errors;
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return 'Nome de usuário deve ter 3-30 caracteres e conter apenas letras, números e underline';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Senha fraca: ${passwordErrors.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    if (name && (name.length < 2 || name.length > 100)) {
      setError('Nome deve ter entre 2 e 100 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta');
      } else {
        setSuccess(data.message || 'Conta criada com sucesso!');
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (_err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-950 relative overflow-hidden">
      {/* Background Aurora / Efeito de Fundo Cósmico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center mb-6">
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
            FORJAR IDENTIDADE
          </h1>
          <p className="text-slate-400 text-xs mt-1">Crie seu registro de acesso na rede</p>
        </div>

        {/* Alertas de Erro */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-xs border border-red-500/20 flex items-center gap-2">
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Alertas de Sucesso */}
        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-4 text-xs border border-emerald-500/20 flex items-center gap-2">
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <AtSign className="w-3.5 h-3.5 text-purple-400" /> Nome de usuário *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
              required
              placeholder="usuario_123"
            />
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Apenas letras, números e underline. De 3 a 30 caracteres.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <User className="w-3.5 h-3.5 text-purple-400" /> Nome de Exibição
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
              required
              placeholder="Seu nome real ou apelido"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> Endereço de Email
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                placeholder="Mín. 6 dígitos"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Confirmar
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                required
                placeholder="Repita a senha"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide pt-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Inicializando Conta...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Registrar Identidade</span>
              </>
            )}
          </button>
        </form>

        {/* Link para o Login */}
        <p className="text-center text-slate-400 mt-6 text-xs tracking-wide">
          Já possui cadastro?{' '}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 group transition-colors"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Faça
            login
          </Link>
        </p>
      </div>
    </div>
  );
}
