'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { LogoutButton } from '@/components/LogoutButton'
import { CoinBalance } from '@/components/CoinBalance'
import { 
  Home, 
  User, 
  Compass, 
  Menu, 
  X, 
  LogIn, 
  UserPlus 
} from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const isLoggedIn = !!session
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fechar menu ao clicar em um link
  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  // Helper para obter a inicial do nome/email
  const getUserInitial = () => {
    return session?.user?.name?.[0] || session?.user?.email?.[0]?.toUpperCase() || '?'
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 antialiased ${
        isScrolled 
          ? 'galaxy-header-scrolled bg-slate-950/70 border-b border-white/5 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
          : 'galaxy-header bg-transparent'
      }`}>
        {/* Partículas e efeitos de iluminação cósmica no fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="stars opacity-40"></div>
          <div className="stars-small opacity-60"></div>
          <div className="nebula-glow absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-purple-500/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo principal com Ícone Android Squircle */}
            <Link href="/" className="flex items-center gap-3 group shrink-0 select-none">
              <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all duration-300 transform group-hover:scale-[1.02]">
                <div className="w-full h-full bg-slate-950 rounded-[11px] overflow-hidden flex items-center justify-center">
                  <Image 
                    src="/worldo_icon.png" 
                    alt="Worldo Logo Icon"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
              <span className="text-2xl md:text-3xl font-black tracking-wider galaxy-text group-hover:opacity-90 transition-all duration-300 transform group-hover:scale-[1.02]">
                𝕎𝕠𝕣𝕝𝕕𝕠
              </span>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/" 
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
              >
                <span>Início</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link 
                    href="/perfil" 
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Perfil</span>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
                  </Link>
                  <Link 
                    href="/explorar" 
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Explorar</span>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {!isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="galaxy-btn-primary flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl border border-white/5 bg-white/5 text-white hover:bg-white/10 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Entrar</span>
                  </Link>
                  <Link 
                    href="/register" 
                    className="galaxy-btn-secondary flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastrar</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <CoinBalance />
                  
                  {/* Cartão de Usuário Glassmorphic */}
                  <div className="flex items-center gap-3 galaxy-user-card bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-inner">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center relative ring-2 ring-white/10">
                      {session.user?.avatar && session.user.avatar !== "None" ? (
                        <Image 
                          src={session.user.avatar} 
                          alt="Avatar" 
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-black tracking-tight">
                          {getUserInitial()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-200 pr-1 max-w-[120px] truncate">
                      Olá, {session.user?.name || session.user?.email?.split('@')[0]}
                    </span>
                  </div>
                  
                  <LogoutButton />
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white transition-all z-50 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-all duration-500 md:hidden ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Lateral Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-white/5 shadow-2xl z-40 transition-transform duration-500 ease-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-6 pb-8 relative">
          {/* Brilho interno do Menu Mobile */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full"></div>
          
          {/* Logo no topo do Menu Mobile */}
          <div className="px-6 pb-4 flex items-center gap-3 border-b border-white/5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[7px] overflow-hidden flex items-center justify-center">
                <Image 
                  src="/logo-icon.png" 
                  alt="Worldo Logo Icon"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xl font-black tracking-wider galaxy-text select-none">
              𝕎𝕠𝕣𝕝𝕕𝕠
            </span>
          </div>

          {/* User Profile Mobile */}
          {isLoggedIn && (
            <div className="px-5 py-4 mb-2 border-b border-white/5">
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                  {session.user?.avatar && session.user.avatar !== "None" ? (
                    <Image 
                      src={session.user.avatar} 
                      alt="Avatar" 
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-black">
                      {getUserInitial()}
                    </span>
                  )}
                </div>

                <div className="overflow-hidden">
                  <p className="text-white text-sm font-bold truncate">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              
              {/* Widget de Moedas no Perfil Mobile */}
              <div className="mt-4">
                <CoinBalance onClick={handleLinkClick}/>
              </div>
            </div>
          )}

          {/* Links de Navegação Mobile */}
          <nav className="flex-grow px-3 pt-4 space-y-1">
            <Link 
              href="/" 
              onClick={handleLinkClick}
              className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
            >
              <Home className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
              <span>Início</span>
            </Link>
            
            {isLoggedIn && (
              <>
                <Link 
                  href="/perfil" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <User className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
                  <span>Perfil</span>
                </Link>
                <Link 
                  href="/explorar" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <Compass className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
                  <span>Explorar</span>
                </Link>
              </>
            )}
          </nav>

          {/* Actions Fixadas na Base Mobile */}
          <div className="px-4 pt-4 border-t border-white/5">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <Link 
                  href="/login" 
                  onClick={handleLinkClick}
                  className="galaxy-btn-primary block text-center py-3 text-sm font-bold rounded-xl border border-white/5 bg-white/5 text-white"
                >
                  Entrar
                </Link>
                <Link 
                  href="/register" 
                  onClick={handleLinkClick}
                  className="galaxy-btn-secondary block text-center py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  Cadastrar
                </Link>
              </div>
            ) : (
              <div onClick={handleLinkClick} className="w-full">
                <LogoutButton />
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  )
}