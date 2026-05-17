'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { LogoutButton } from '@/components/LogoutButton'

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

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'galaxy-header-scrolled' : 'galaxy-header'
      }`}>
        {/* Partículas de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="stars"></div>
          <div className="stars-small"></div>
          <div className="nebula-glow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo com efeito cósmico */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <span className="text-xl md:text-2xl font-bold galaxy-text group-hover:scale-105 transition-transform duration-300">
                𝕎𝕠𝕣𝕝𝕕𝕠
              </span>
            </Link>

            {/* Desktop Menu com efeito de estrelas */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link 
                href="/" 
                className="galaxy-link hover:text-white transition-all duration-300 font-medium relative group"
              >
                <span>Início</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              {isLoggedIn && (
                <>
                  <Link 
                    href="/perfil" 
                    className="galaxy-link hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Perfil</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link 
                    href="/explorar" 
                    className="galaxy-link hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Explorar</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Actions com estilo galáctico */}
            <div className="hidden md:flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <Link href="/login" className="galaxy-btn-primary text-sm py-2 px-4">
                    <span>Entrar</span>
                  </Link>
                  <Link href="/register" className="galaxy-btn-secondary text-sm py-2 px-4">
                    <span>Cadastrar</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 galaxy-user-card px-3 py-1.5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {session.user?.image ? (
                            <img 
                            src={session.user.image} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-sm font-bold">
                            {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase()}
                            </span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm">
                      Olá, {session.user?.name || session.user?.email?.split('@')[0]}
                    </span>
                  </div>
                  <LogoutButton />
                </>
              )}
            </div>

            {/* Mobile Menu Button com efeito estrela */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-300 z-50 galaxy-menu-btn"
              aria-label="Menu"
            >
              <div className="relative w-6 h-5">
                <span className={`absolute left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 top-2' : 'top-0'
                }`}></span>
                <span className={`absolute left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300 top-2 ${
                  isMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`absolute left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 top-2' : 'top-4'
                }`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay com tema galáxia */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-all duration-500 md:hidden ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Panel com efeito galáctico */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 galaxy-mobile-panel shadow-2xl z-40 transition-transform duration-500 md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-20 pb-6 relative">
          {/* Efeito de brilho no fundo */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
          
          {/* User info mobile com estilo galáctico */}
          {isLoggedIn && (
            <div className="px-6 pb-6 mb-6 border-b border-purple-500/20 relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                   {session.user?.image ? (
                            <img 
                            src={session.user.image} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-sm font-bold">
                            {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase()}
                            </span>
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs mt-1">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links com ícones galácticos */}
          <nav className="flex-1 px-4 space-y-2">
            <Link 
              href="/" 
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 galaxy-mobile-link group"
            >
              <i className="bi bi-house-door text-xl group-hover:scale-110 transition-transform"></i>
              <span>Início</span>
            </Link>
            
            {isLoggedIn && (
              <>
                <Link 
                  href="/perfil" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-3 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 galaxy-mobile-link group"
                >
                  <i className="bi bi-person text-xl group-hover:scale-110 transition-transform"></i>
                  <span>Perfil</span>
                </Link>
                <Link 
                  href="/explorar" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-3 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 galaxy-mobile-link group"
                >
                  <i className="bi bi-compass text-xl group-hover:scale-110 transition-transform"></i>
                  <span>Explorar</span>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Actions com botões galácticos */}
          <div className="px-4 pt-6 border-t border-purple-500/20">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <Link 
                  href="/login" 
                  onClick={handleLinkClick}
                  className="galaxy-btn-primary block text-center py-2.5"
                >
                  Entrar
                </Link>
                <Link 
                  href="/register" 
                  onClick={handleLinkClick}
                  className="galaxy-btn-secondary block text-center py-2.5"
                >
                  Cadastrar
                </Link>
              </div>
            ) : (
              <div onClick={handleLinkClick}>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}