import { auth } from '@/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { redirect } from 'next/navigation'
import { Sparkles, UserCircle, Palette, Coins, MessageSquare } from 'lucide-react'

export default async function Home() {
  const session = await auth()

  // Se não estiver autenticado, redireciona imediatamente.
  // O Next.js para a execução do componente aqui mesmo.
  if (!session?.user) {
    redirect('/login')
  }

  // Captura o nome formatado ou o prefixo do email
  const displayName = session.user?.name || session.user?.email?.split('@')[0] || 'Viajante'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20 relative antialiased text-slate-100 selection:bg-purple-500/30 overflow-hidden sm:overflow-visible">
      
      {/* Background Glows (Atmosfera do Dashboard) - Ajustado para mobile */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-75 sm:w-150 h-50 sm:h-75 bg-purple-600/15 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0" />

      {/* Banner de Boas-vindas (Card Principal) */}
      <div className="relative z-10 text-center mb-12 sm:mb-16">
        {/* Paddings reduzidos no mobile (p-6) e bordas suavizadas (rounded-2xl) */}
        <div className="bg-slate-900/50 border border-white/6 p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-3xl max-w-3xl mx-auto backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Detalhe de luz superior no card */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />

          {/* Ícone menor no mobile */}
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-inner">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>

          {/* Textos escalonáveis: menores no celular, maiores no desktop */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 tracking-tight drop-shadow-sm">
            Bem-vindo de volta,{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400">
              {displayName}
            </span>!
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-10 font-medium max-w-xl mx-auto leading-relaxed">
            Seu painel de controle está pronto. Continue explorando nosso universo e conectando-se com a comunidade.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link 
              href="/worldo/perfil" 
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98]"
            >
              <UserCircle className="w-5 h-5" />
              <span>Meu Perfil</span>
            </Link>
            
            {/* Botão de logout ocupando largura total no mobile */}
            <div className="w-full sm:w-auto flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
              <LogoutButton/>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Funcionalidades */}
      {/* gap-4 no mobile, gap-6 no desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        
        {/* Card 1: Cosméticos */}
        {/* Paddings menores (p-6) em telas pequenas */}
        <div className="bg-slate-900/40 border border-white/4 p-6 sm:p-8 rounded-2xl backdrop-blur-sm shadow-xl hover:-translate-y-1 hover:bg-slate-900/60 hover:border-purple-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
            <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Cosméticos</h3>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            Crie e venda molduras exclusivas para personalizar seu perfil e destacar sua presença.
          </p>
        </div>

        {/* Card 2: Moedas Virtuais */}
        <div className="bg-slate-900/40 border border-white/4 p-6 sm:p-8 rounded-2xl backdrop-blur-sm shadow-xl hover:-translate-y-1 hover:bg-slate-900/60 hover:border-amber-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Moedas Virtuais</h3>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            Adquira moedas, gerencie sua carteira e compre itens exclusivos disponíveis na plataforma.
          </p>
        </div>

        {/* Card 3: Chat Social */}
        <div className="bg-slate-900/40 border border-white/4 p-6 sm:p-8 rounded-2xl backdrop-blur-sm shadow-xl hover:-translate-y-1 hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Chat Social</h3>
          <p className="text-sm font-medium text-slate-400 leading-relaxed">
            Conecte-se com a comunidade. Converse com amigos em chats privados ou interaja em grupos.
          </p>
        </div>

      </div>
    </div>
  )
}