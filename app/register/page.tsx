'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { useSession } from 'next-auth/react';
import { Sparkles, User, AtSign, Mail, Lock, UserPlus, ArrowLeft, AlertTriangle } from 'lucide-react';

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

  // ═══════════════════════════════════════════════════════
  // CONSTANTES DE VALIDAÇÃO
  // ═══════════════════════════════════════════════════════
  const MAX_NAME_LENGTH = 50;
  const MIN_NAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 30;
  const MIN_USERNAME_LENGTH = 3;
  const MIN_PASSWORD_LENGTH = 6;

  // ═══════════════════════════════════════════════════════
  // ESTADOS DE ERRO POR CAMPO
  // ═══════════════════════════════════════════════════════
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  // ═══════════════════════════════════════════════════════
  // FUNÇÕES DE VALIDAÇÃO
  // ═══════════════════════════════════════════════════════
  const validateEmail = (value: string) => {
    if (!value) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return '';
  };

  const validateUsername = (value: string) => {
    if (!value) return 'Username é obrigatório';
    const trimmed = value.trim();
    if (trimmed.length < MIN_USERNAME_LENGTH) return `Username deve ter pelo menos ${MIN_USERNAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_USERNAME_LENGTH) return `Username deve ter no máximo ${MAX_USERNAME_LENGTH} caracteres`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username deve conter apenas letras, números e underscore';
    }
    return '';
  };

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Nome é obrigatório';
    if (trimmed.length < MIN_NAME_LENGTH) return `Nome deve ter pelo menos ${MIN_NAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_NAME_LENGTH) return `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`;
    return '';
  };

  const validatePassword = (value: string) => {
    const errors = [];
    
    if (!value) return 'Senha é obrigatória';
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }
    
    if (!/[A-Z]/.test(value)) errors.push('1 letra maiúscula');
    if (!/[a-z]/.test(value)) errors.push('1 letra minúscula');
    if (!/[0-9]/.test(value)) errors.push('1 número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.push('1 caractere especial (!@#$%^&*)');
    
    if (errors.length > 0) {
      return `Senha precisa de: ${errors.join(', ')}`;
    }
    return '';
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) return 'Confirmação de senha é obrigatória';
    if (value !== password) return 'As senhas não coincidem';
    return '';
  };

  // Verifica se todos os campos obrigatórios estão preenchidos
  const isFormFilled = email && username && name && password && confirmPassword;

  // Verifica se há erros em algum campo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ═══════════════════════════════════════════════════════
    // VALIDAÇÃO DE TODOS OS CAMPOS ANTES DE ENVIAR
    // ═══════════════════════════════════════════════════════
    const emailError = validateEmail(email);
    const usernameError = validateUsername(username);
    const nameError = validateName(name);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setFieldErrors({
      email: emailError,
      username: usernameError,
      name: nameError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    if (emailError || usernameError || nameError || passwordError || confirmPasswordError) {
      setError('Corrija os campos destacados antes de registrar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
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
          {/* Username */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <AtSign className="w-3.5 h-3.5 text-purple-400" /> Nome de usuário *
              <span className="text-[10px] text-slate-500 font-normal ml-auto">
                {username.length}/{MAX_USERNAME_LENGTH}
              </span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setUsername(value);
                setFieldErrors({ ...fieldErrors, username: validateUsername(value) });
              }}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                fieldErrors.username
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
              }`}
              required
              placeholder="usuario_123"
              maxLength={MAX_USERNAME_LENGTH}
            />
            {fieldErrors.username && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fieldErrors.username}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Apenas letras, números e underline. De {MIN_USERNAME_LENGTH} a {MAX_USERNAME_LENGTH} caracteres.
            </p>
          </div>

          {/* Nome de Exibição */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <User className="w-3.5 h-3.5 text-purple-400" /> Nome de Exibição *
              <span className="text-[10px] text-slate-500 font-normal ml-auto">
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const value = e.target.value;
                setName(value);
                setFieldErrors({ ...fieldErrors, name: validateName(value) });
              }}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                fieldErrors.name
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
              }`}
              required
              placeholder="Seu nome real ou apelido"
              maxLength={MAX_NAME_LENGTH}
            />
            {fieldErrors.name && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              De {MIN_NAME_LENGTH} a {MAX_NAME_LENGTH} caracteres.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> Endereço de Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                setFieldErrors({ ...fieldErrors, email: validateEmail(value) });
              }}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                fieldErrors.email
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
              }`}
              required
              placeholder="seu@email.com"
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Senha e Confirmação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Senha */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Senha *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  setFieldErrors({ ...fieldErrors, password: validatePassword(value) });
                  // Revalidar confirmação se já tiver valor
                  if (confirmPassword) {
                    setFieldErrors(prev => ({ 
                      ...prev, 
                      confirmPassword: validateConfirmPassword(confirmPassword) 
                    }));
                  }
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.password
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                required
                placeholder="Mín. 6 dígitos"
              />
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.password}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Mín. {MIN_PASSWORD_LENGTH} caracteres. Letras maiúsculas, minúsculas, números e especial.
              </p>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Confirmar *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfirmPassword(value);
                  setFieldErrors({ ...fieldErrors, confirmPassword: validateConfirmPassword(value) });
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.confirmPassword
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                required
                placeholder="Repita a senha"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={loading || !isFormFilled}
            className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
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