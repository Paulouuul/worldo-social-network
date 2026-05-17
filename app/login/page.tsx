'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setSuccess('Email verificado! Agora você pode fazer login.')
    }
    
    const errorParam = searchParams.get('error')
    if (errorParam === 'CredentialsSignin') {
      setError('Email ou senha inválidos')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('verifique seu email') || 
            result.error.includes('Verifique seu email')) {
          setError('Por favor, verifique seu email antes de fazer login')
        } else if (result.error.includes('Usuário não encontrado')) {
          setError('Email não encontrado. Verifique ou registre-se.')
        } else if (result.error.includes('Senha inválida')) {
          setError('Senha incorreta. Tente novamente.')
        } else {
          setError('Email ou senha inválidos')
        }
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 card-highlight">
        <div className="flex justify-center">
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
        
        <h1 className="text-2xl font-bold text-center">Login</h1>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/30">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 text-green-400 p-3 rounded mb-4 text-sm border border-green-500/30">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-gray-800 text-sm">Ou continue com</p>
          <div className="space-y-2 mt-2">
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
             <i className="bi bi-google"></i> Google
            </button>
            <button
              onClick={() => signIn('github', { callbackUrl: '/' })}
              className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <i className="bi bi-github"></i> GitHub
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-800 mt-4 text-sm">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  )
}