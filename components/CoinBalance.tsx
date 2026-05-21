'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Coins, Plus } from 'lucide-react'

interface CoinBalanceProps {
  onClick?: () => void
}

export function CoinBalance({ onClick }: CoinBalanceProps) {
  const { data: session, status } = useSession()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Memoizando a função para evitar recriações desnecessárias no useEffect
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/coins/balance')
      if (!res.ok) throw new Error('Falha ao buscar saldo')
      
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch (error) {
      console.error('Erro ao atualizar saldo de moedas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Só dispara a busca se o usuário estiver explicitamente autenticado
    if (status !== 'authenticated') return

    setLoading(true)
    fetchBalance()

    // Pooling de atualização a cada 30 segundos
    const interval = setInterval(fetchBalance, 30000)
    
    return () => clearInterval(interval)
  }, [status, fetchBalance])

  // Se o NextAuth ainda está checando ou o usuário não está logado, não renderiza nada
  if (status === 'loading' || status === 'unauthenticated') {
    return null
  }

  // Formata o número (Ex: 1500 vira 1.500)
  const formattedBalance = balance !== null 
    ? new Intl.NumberFormat('pt-BR').format(balance) 
    : '0'

  return (
    <Link 
      href="/coins" 
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-slate-900/60 hover:bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 rounded-xl transition-all duration-300 group select-none backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
        {/* Efeito sutil de brilho no ícone */}
        <span className="absolute inset-0 bg-amber-400/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {loading && balance === null ? (
        // Shimmer/Skeleton loading se for a primeiríssima carga do componente
        <div className="w-8 h-4 bg-purple-500/20 animate-pulse rounded" />
      ) : (
        <span className="font-bold text-sm text-slate-100 tracking-wide">
          {formattedBalance}
        </span>
      )}

      <div className="bg-purple-500/10 p-0.5 rounded-md border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
        <Plus className="w-3 h-3 text-purple-400" />
      </div>
    </Link>
  )
}