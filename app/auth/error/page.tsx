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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro de Autenticação</h1>
        <p className="text-gray-700 mb-6">{getErrorMessage(error || '')}</p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Voltar para o Login
        </Link>
      </div>
    </div>
  )
}