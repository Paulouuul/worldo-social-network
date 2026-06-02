'use client'

import Link from 'next/link'
import { XCircle, RefreshCcw, Home } from 'lucide-react'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'


export default function CancelPage() {
  const { status } = useSession()
  if (status === 'unauthenticated') {
    redirect('/login')
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative antialiased selection:bg-purple-500/30 bg-[#020617]">
      
      {/* Background Glows (Tema de Cancelamento + Identidade Visual) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-1/4 w-75 h-75 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Card Glassmorphism */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/50 border border-white/6 rounded-2xl p-8 md:p-10 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-center">
        
        {/* Ícone de Cancelamento com Efeito de Pulso Sutil */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 relative">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-md animate-pulse" />
            <XCircle className="w-8 h-8 text-rose-400 relative z-10" />
          </div>
        </div>
        
        {/* Textos */}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4 drop-shadow-sm">
          Pagamento Cancelado
        </h1>
        
        {/* Container de Mensagem Embutido */}
        <div className="bg-slate-950/40 border border-white/4 rounded-xl p-5 mb-8 shadow-inner relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-rose-500/50 to-transparent" />
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            A operação foi interrompida de forma segura. <strong className="text-slate-200 font-semibold">Nenhuma cobrança foi realizada</strong> e suas moedas não foram creditadas.
          </p>
        </div>

        {/* Grupo de Ações (Botões Premium) */}
        <div className="flex flex-col gap-3">
          {/* Botão Primário de Ação */}
          <Link 
            href="/worldo/coins" 
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98]"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </Link>
          
          {/* Botão Secundário / Voltar */}
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide bg-slate-800/50 border border-white/6 hover:border-white/12 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 shadow-lg active:scale-[0.98] group"
          >
            <Home className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            <span>Voltar para o Início</span>
          </Link>
        </div>
      </div>
    </div>
  )
}