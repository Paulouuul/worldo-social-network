'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image' // 👈 IMPORTANTE: adicionar esta importação

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePassword = (pass: string) => {
    const errors = []
    
    if (pass.length < 6) {
      errors.push('pelo menos 6 caracteres')
    }
    if (pass.length > 50) {
      errors.push('no máximo 50 caracteres')
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('pelo menos 1 letra maiúscula')
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('pelo menos 1 letra minúscula')
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('pelo menos 1 número')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('pelo menos 1 caractere especial (!@#$%^&* etc)')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const passwordErrors = validatePassword(password)
    
    if (passwordErrors.length > 0) {
      setError(`Senha fraca: ${passwordErrors.join(', ')}`)
      return
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    // Validação de email básica
    if (!email.includes('@') || !email.includes('.')) {
      setError('Email inválido')
      return
    }
    
    // Validação de nome (opcional mas recomendado)
    if (name && (name.length < 2 || name.length > 100)) {
      setError('Nome deve ter entre 2 e 100 caracteres')
      return
    }
    
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta')
      } else {
        setSuccess(data.message)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full rounded-lg shadow-xl p-8 card-highlight">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-172 h-62"> {/* Alterado para tamanho válido */}
            <Image
              src="/worldo_logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6">Criar Conta</h1>
        
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
            <label className="block mb-2">Nome (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Seu nome"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <p className="text-center text-gray-800 mt-4 text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}