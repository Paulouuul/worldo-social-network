'use client'

import Link from 'next/link'
import { ClientImage } from '@/components/ClientImage' 
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

import { LogoutButton } from '@/components/LogoutButton'
import { CoinBalance } from '@/components/CoinBalance'
import { AvatarWithFrame } from './AvatarWithFrame'

import { 
  Home, 
  User, 
  Compass, 
  Menu, 
  X, 
  Store,
  Package,
  Sparkles,
  ChevronDown
} from 'lucide-react'

export default function Header() {
  const { data: session, status } = useSession()
  const isLoggedIn = !!session
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false)
  const cosmeticsRef = useRef<HTMLDivElement>(null)

  // Detectar scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fechar dropdown de cosméticos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cosmeticsRef.current && !cosmeticsRef.current.contains(event.target as Node)) {
        setIsCosmeticsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Impedir scroll do body quando o menu mobile estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMenuOpen])

  if (status === 'loading') return null
  if (status !== 'authenticated') return null

  // Fechar menu ao clicar em um link
  const handleLinkClick = () => {
    setIsMenuOpen(false)
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
          <div className="nebula-glow absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-37.5 bg-purple-500/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo principal com Ícone Android Squircle */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 select-none">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-linear-to-tr from-blue-600 via-indigo-600 to-purple-600 p-px shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all duration-300 transform group-hover:scale-[1.02]">
                <div className="w-full h-full bg-slate-950 rounded-[11px] overflow-hidden flex items-center justify-center">
                  <ClientImage 
                    src="/worldo_icon.png" 
                    alt="Worldo Logo Icon"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-wider galaxy-text group-hover:opacity-90 transition-all duration-300 transform group-hover:scale-[1.02]">
                𝕎𝕠𝕣𝕝𝕕𝕠
              </span>
            </Link>

            {/* Desktop Menu (Visível apenas em telas grandes - lg para cima) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link 
                href="/" 
                className="px-3 xl:px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
              >
                <span>Início</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link 
                    href="/worldo/perfil" 
                    className="px-3 xl:px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Perfil</span>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
                  </Link>
                  <Link 
                    href="/worldo/explore" 
                    className="px-3 xl:px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative group"
                  >
                    <span>Explorar</span>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-blue-500 to-purple-500 group-hover:w-8/12 transition-all duration-300 rounded-full"></span>
                  </Link>

                  {/* Dropdown de Cosméticos */}
                  <div 
                    className="relative"
                    ref={cosmeticsRef}
                    onMouseEnter={() => setIsCosmeticsOpen(true)}
                    onMouseLeave={() => setIsCosmeticsOpen(false)}
                  >
                    <button
                      onClick={() => setIsCosmeticsOpen(!isCosmeticsOpen)}
                      className="px-3 xl:px-4 py-2 text-sm text-slate-300 hover:text-white transition-all duration-300 font-medium relative flex items-center gap-1.5"
                    >
                      <span>Cosméticos</span>
                      <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-300 ${isCosmeticsOpen ? 'rotate-180' : ''}`} />
                      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-full ${isCosmeticsOpen ? 'w-8/12' : 'w-0'}`}></span>
                    </button>
                    
                    {/* Menu Flutuante */}
                    <div className={`absolute top-full right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-2 transition-all duration-300 z-50 transform origin-top-right ${isCosmeticsOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                      <Link
                        href="/worldo/cosmetics/marketplace"
                        onClick={() => setIsCosmeticsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors group/link"
                      >
                        <Store className="w-4 h-4 text-purple-400 group-hover/link:scale-110 transition-transform" />
                        <span>Marketplace</span>
                      </Link>
                      <Link
                        href="/worldo/cosmetics/inventory"
                        onClick={() => setIsCosmeticsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors group/link"
                      >
                        <Package className="w-4 h-4 text-blue-400 group-hover/link:scale-110 transition-transform" />
                        <span>Inventário</span>
                      </Link>
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      <Link
                        href="/worldo/cosmetics/create"
                        onClick={() => setIsCosmeticsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors group/link"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400 group-hover/link:scale-110 transition-transform" />
                        <span>Criar Moldura</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
                <CoinBalance/>
                
                {/* Cartão de Usuário Glassmorphic */}
                <div className="flex items-center gap-2 xl:gap-3 galaxy-user-card bg-white/5 border border-white/10 px-2 py-1.5 xl:px-3 rounded-xl backdrop-blur-sm shadow-inner max-w-50 xl:max-w-62.5">
                  <div className="shrink-0">
                    <AvatarWithFrame 
                      avatarUrl={session.user?.avatar}
                      name={session?.user?.name} 
                      frameUrl={session.user?.equippedFrame?.imageUrl}
                      rarity={session.user?.equippedFrame?.rarity || 'COMUM'}
                      size="smsm"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-200 pr-1 truncate">
                    Olá, {session.user?.name || session.user?.email?.split('@')[0]}
                  </span>
                </div>
                
                <LogoutButton />
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white transition-all z-50 focus:outline-none shrink-0"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-all duration-500 lg:hidden ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Lateral Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-75 bg-slate-900 border-l border-white/5 shadow-2xl z-50 transition-transform duration-500 ease-out lg:hidden flex flex-col ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-6 pb-8 relative overflow-y-auto custom-scrollbar">
          {/* Brilho interno do Menu Mobile */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full"></div>
          
          {/* Logo no topo do Menu Mobile */}
          <div className="px-5 sm:px-6 pb-4 flex items-center gap-3 border-b border-white/5 shrink-0">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-linear-to-tr from-blue-600 to-purple-600 p-px">
              <div className="w-full h-full bg-slate-950 rounded-[7px] overflow-hidden flex items-center justify-center">
                <ClientImage 
                  src="/worldo_icon.png" 
                  alt="Worldo Logo Icon"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xl font-black tracking-wider galaxy-text select-none">
              Menu
            </span>
          </div>

          {/* User Profile Mobile */}
          {isLoggedIn && (
            <div className="px-4 sm:px-5 py-4 mb-2 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                <div className="shrink-0">
                  <AvatarWithFrame 
                    avatarUrl={session.user?.avatar}
                    name={session?.user?.name} 
                    frameUrl={session.user?.equippedFrame?.imageUrl}
                    rarity={session.user?.equippedFrame?.rarity || 'COMUM'}
                    size="sm"
                  />
                </div>
                <div className="overflow-hidden w-full">
                  <p className="text-white text-sm font-bold truncate">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              
              {/* Widget de Moedas no Perfil Mobile */}
              <div className="mt-4 flex justify-center w-full">
                <CoinBalance onClick={handleLinkClick}/>
              </div>
            </div>
          )}

          {/* Links de Navegação Mobile */}
          <nav className="grow px-3 pt-2 space-y-1">
            <Link 
              href="/" 
              onClick={handleLinkClick}
              className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
            >
              <Home className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all shrink-0" />
              <span className="truncate">Início</span>
            </Link>
            
            {isLoggedIn && (
              <>
                <Link 
                  href="/worldo/perfil" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <User className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all shrink-0" />
                  <span className="truncate">Perfil</span>
                </Link>
                <Link 
                  href="/worldo/explore" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <Compass className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all shrink-0" />
                  <span className="truncate">Explorar</span>
                </Link>

                {/* Seção Cosméticos no Mobile */}
                <div className="mt-6 mb-2 px-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Cosméticos</p>
                </div>
                
                <Link 
                  href="/worldo/cosmetics/marketplace" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <Store className="w-4 h-4 text-slate-400 group-hover:text-purple-400 group-hover:scale-105 transition-all shrink-0" />
                  <span className="truncate">Marketplace</span>
                </Link>
                <Link 
                  href="/worldo/cosmetics/inventory" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <Package className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all shrink-0" />
                  <span className="truncate">Meu Inventário</span>
                </Link>
                <Link 
                  href="/worldo/cosmetics/create" 
                  onClick={handleLinkClick}
                  className="flex items-center gap-3.5 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-sm transition-all group"
                >
                  <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:scale-105 transition-all shrink-0" />
                  <span className="truncate">Criar Moldura</span>
                </Link>
              </>
            )}
          </nav>

          {/* Actions Fixadas na Base Mobile */}
          <div className="px-4 pt-4 border-t border-white/5 shrink-0 mt-4">
              <div onClick={handleLinkClick} className="w-full flex justify-center">
                <LogoutButton />
              </div>
          </div>
          
        </div>
      </div>
    </>
  )
}