// app/register/page.tsx
// Página /register: cadastro com email e senha. Valida os campos no cliente (as mesmas regras da
// API) e chama /api/register, que envia o email de verificação.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, AtSign, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { FeedbackMessage } from '@/components/ui/feedback/FeedbackMessage';
import { FieldError, FieldLabel, TextInput } from '@/components/ui/forms/FormField';
import { PrimaryButton } from '@/components/ui/buttons/PrimaryButton';
import { AuthShell } from '@/components/auth/AuthShell';
import { ROUTES } from '@/constants/routes';
import { NAME_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_LENGTH } from '@/constants/validation';
import { UI_TIMING } from '@/constants/ui';

/** Formulário de cadastro com validação por campo e redirecionamento para /login após o sucesso. */
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

  // Erro de validação de cada campo
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  /** Valida o formato do email. */
  const validateEmail = (value: string) => {
    if (!value) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return '';
  };

  /** Valida o username: letras, números e underscore (limites em USERNAME_LENGTH). */
  const validateUsername = (value: string) => {
    if (!value) return 'Username é obrigatório';
    const trimmed = value.trim();
    if (trimmed.length < USERNAME_LENGTH.min)
      return `Username deve ter pelo menos ${USERNAME_LENGTH.min} caracteres`;
    if (trimmed.length > USERNAME_LENGTH.max)
      return `Username deve ter no máximo ${USERNAME_LENGTH.max} caracteres`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username deve conter apenas letras, números e underscore';
    }
    return '';
  };

  /** Valida o nome de exibição (limites em NAME_LENGTH). */
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Nome é obrigatório';
    if (trimmed.length < NAME_LENGTH.min)
      return `Nome deve ter pelo menos ${NAME_LENGTH.min} caracteres`;
    if (trimmed.length > NAME_LENGTH.max)
      return `Nome deve ter no máximo ${NAME_LENGTH.max} caracteres`;
    return '';
  };

  /**
   * Valida a senha: mínimo de 6 caracteres com maiúscula, minúscula, número e caractere
   * especial.
   */
  const validatePassword = (value: string) => {
    const errors = [];

    if (!value) return 'Senha é obrigatória';
    if (value.length < PASSWORD_MIN_LENGTH) {
      return `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`;
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

  /** Confere se a confirmação é igual à senha. */
  const validateConfirmPassword = (value: string) => {
    if (!value) return 'Confirmação de senha é obrigatória';
    if (value !== password) return 'As senhas não coincidem';
    return '';
  };

  /** Impede digitar espaços no campo. */
  const handleKeyDownNoSpaces = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  // Todos os campos obrigatórios preenchidos
  const isFormFilled = email && username && name && password && confirmPassword;

  // Algum campo com erro (desabilita o botão)
  const hasErrors = Object.values(fieldErrors).some((errorMsg) => errorMsg !== '');

  /** Revalida todos os campos e envia o cadastro; em sucesso redireciona para /login após 3s. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Valida todos os campos antes de enviar
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

    // Com erros, não envia (os erros já aparecem nos campos)
    if (emailError || usernameError || nameError || passwordError || confirmPasswordError) {
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
        setTimeout(() => router.push(ROUTES.login), UI_TIMING.messageMs);
      }
    } catch (_err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forjar Identidade"
      subtitle="Crie seu registro de acesso na rede"
      footerText="Já possui cadastro?"
      footerLink={{
        href: ROUTES.login,
        label: (
          <>
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Faça
            login
          </>
        ),
      }}
    >
      {/* Erro retornado pela API */}
      <FeedbackMessage type="error" size="sm" message={error} className="mb-4" />

      {/* Mensagem de sucesso */}
      <FeedbackMessage type="success" size="sm" message={success} className="mb-4" />

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <FieldLabel icon={AtSign} counter={{ value: username.length, max: USERNAME_LENGTH.max }}>
            Nome de usuário *
          </FieldLabel>
          <TextInput
            type="text"
            value={username}
            onKeyDown={handleKeyDownNoSpaces}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              setUsername(value);
              setFieldErrors({ ...fieldErrors, username: validateUsername(value) });
            }}
            hasError={!!fieldErrors.username}
            required
            placeholder="usuario_123"
            maxLength={USERNAME_LENGTH.max}
          />
          <FieldError message={fieldErrors.username} />
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            Apenas letras, números e underline. De {USERNAME_LENGTH.min} a {USERNAME_LENGTH.max}{' '}
            caracteres.
          </p>
        </div>

        {/* Nome de Exibição */}
        <div>
          <FieldLabel icon={User} counter={{ value: name.length, max: NAME_LENGTH.max }}>
            Nome de Exibição *
          </FieldLabel>
          <TextInput
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors({ ...fieldErrors, name: validateName(e.target.value) });
            }}
            onBlur={() => {
              const trimmed = name.trim().replace(/\s+/g, ' ');
              if (trimmed !== name) {
                setName(trimmed);
                setFieldErrors({ ...fieldErrors, name: validateName(trimmed) });
              }
            }}
            hasError={!!fieldErrors.name}
            required
            placeholder="Seu nome real ou apelido"
            maxLength={NAME_LENGTH.max}
          />
          <FieldError message={fieldErrors.name} />
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            De {NAME_LENGTH.min} a {NAME_LENGTH.max} caracteres.
          </p>
        </div>

        {/* Email */}
        <div>
          <FieldLabel icon={Mail}>Endereço de Email *</FieldLabel>
          <TextInput
            type="email"
            value={email}
            onKeyDown={handleKeyDownNoSpaces}
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, '');
              setEmail(value);
              setFieldErrors({ ...fieldErrors, email: validateEmail(value) });
            }}
            hasError={!!fieldErrors.email}
            required
            placeholder="seu@email.com"
          />
          <FieldError message={fieldErrors.email} />
        </div>

        {/* Senha e Confirmação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Senha */}
          <div>
            <FieldLabel icon={Lock}>Senha *</FieldLabel>
            <TextInput
              type="password"
              value={password}
              onKeyDown={handleKeyDownNoSpaces}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                setPassword(value);
                setFieldErrors({ ...fieldErrors, password: validatePassword(value) });

                if (confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(confirmPassword),
                  }));
                }
              }}
              hasError={!!fieldErrors.password}
              required
              placeholder="Mín. 6 dígitos"
            />
            <FieldError message={fieldErrors.password} />
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Mín. {PASSWORD_MIN_LENGTH} caracteres. Letras maiúsculas, minúsculas, números e
              especial.
            </p>
          </div>

          {/* Confirmar Senha */}
          <div>
            <FieldLabel icon={Lock}>Confirmar *</FieldLabel>
            <TextInput
              type="password"
              value={confirmPassword}
              onKeyDown={handleKeyDownNoSpaces}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                setConfirmPassword(value);

                const errorMsg = !value
                  ? 'Confirmação de senha é obrigatória'
                  : value !== password
                    ? 'As senhas não coincidem'
                    : '';

                setFieldErrors({
                  ...fieldErrors,
                  confirmPassword: errorMsg,
                });
              }}
              hasError={!!fieldErrors.confirmPassword}
              required
              placeholder="Repita a senha"
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </div>
        </div>

        {/* Botão de envio */}
        <PrimaryButton
          type="submit"
          disabled={loading || !isFormFilled || hasErrors}
          loading={loading}
          loadingText="Inicializando Conta..."
          icon={UserPlus}
        >
          Registrar Identidade
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
