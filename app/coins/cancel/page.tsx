'use client'

import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="card-highlight rounded-xl p-8 border border-gray-800">
        {/* Ícone sutilmente estilizado */}
        <div className="text-6xl mb-4 select-none">❌</div>
        
        <h1 className="text-2xl font-bold mb-4 text-white">
          Pagamento Cancelado
        </h1>
        
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          A operação foi interrompida pelo usuário ou pela operadora. 
          Nenhuma cobrança foi realizada e nenhuma moeda foi creditada.
        </p>

        {/* Grupo de ações para dar flexibilidade ao usuário */}
        <div className="flex flex-col gap-3">
          <Link href="/coins" className="btn-primary w-full inline-block">
            Tentar Novamente
          </Link>
          
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors py-2 font-medium"
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  )
}