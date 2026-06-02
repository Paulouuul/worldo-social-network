'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

function SuccessPageContent() {
  const { status } = useSession() 
  const router = useRouter()
  
  // Caso precise validar o ID do Stripe no banco futuramente:
  
  const [countdown, setCountdown] = useState(5)

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  // Efeito 1: Gerencia apenas o relógio do countdown de forma limpa
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  // Efeito 2: Monitora o countdown e dispara a navegação de forma isolada e segura
  useEffect(() => {
    if (countdown === 0) {
      router.push('/worldo/coins')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Efeitos de fundo para manter a consistência visual da rede */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 text-center relative z-10">
        {/* Ícone Animado */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
          <Sparkles className="w-4 h-4 text-amber-400 absolute top-2 right-2 animate-bounce" />
        </div>

        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-slate-200 to-slate-400 tracking-wide mb-3">
          Pagamento Realizado!
        </h1>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Suas moedas já foram creditadas na sua carteira digital e o saldo foi atualizado com sucesso na rede.
        </p>
        
        {/* Caixa do Contador */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 mb-6 text-xs text-purple-300 font-medium tracking-wide flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          Redirecionando para a loja em 
          <span className="font-bold text-sm text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30">
            {countdown}s
          </span>
        </div>

        {/* Botão de Escape de Emergência */}
        <Link 
          href="/worldo/coins" 
          className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 group"
        >
          <span>Voltar para Loja Agora</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-sm font-medium text-purple-300">Autenticando transação...</p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  )
}