'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou senha inválidos'
      case 'VerificationRequired':
        return 'Por favor, verifique seu email antes de fazer login'
      default:
        return 'Ocorreu um erro ao fazer login. Tente novamente.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 card-highlight text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Erro de Autenticação</h1>
        <p className="mb-6">{getErrorMessage(error || '')}</p>
        <Link
          href="/login"
          className="btn-primary inline-block"
        >
          Voltar para o Login
        </Link>
      </div>
    </div>
  )
}