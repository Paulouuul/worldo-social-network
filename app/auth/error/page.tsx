'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Componente separado que usa useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou senha inválidos'
      case 'VerificationRequired':
        return 'Por favor, verifique seu email antes de fazer login'
      case 'AccessDenied':
        return 'Acesso negado'
      case 'Configuration':
        return 'Erro de configuração do servidor'
      default:
        return 'Ocorreu um erro ao fazer login. Tente novamente.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 card-highlight text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-172 h-62">
            <Image
              src="/worldo_social_network_card.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="bg-red-500/10 text-red-400 p-4 rounded mb-6 border border-red-500/30">
          <h1 className="text-xl font-bold mb-2">Erro de Autenticação</h1>
          <p className="text-sm">{getErrorMessage(error || '')}</p>
        </div>
        
        <Link
          href="/login"
          className="btn-primary inline-block w-full text-center"
        >
          Voltar para o Login
        </Link>
        
        <p className="text-center text-gray-500 mt-4 text-sm">
          Precisa de ajuda?{' '}
          <Link href="/support" className="text-blue-400 hover:underline">
            Contate o suporte
          </Link>
        </p>
      </div>
    </div>
  )
}

// Página principal com Suspense (resolve o erro de build)
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full rounded-lg shadow-xl p-8 card-highlight text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-172 h-62">
              <Image
                src="/worldo_social_network_card.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded mb-4"></div>
            <div className="h-20 bg-gray-700 rounded mb-6"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}