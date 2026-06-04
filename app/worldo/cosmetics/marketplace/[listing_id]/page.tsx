'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, redirect } from 'next/navigation'
import Link from 'next/link'
import { ClientImage } from '@/components/ClientImage'
import { AvatarWithFrame } from '@/components/AvatarWithFrame'
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { 
  Coins, 
  User, 
  Store, 
  Package, 
  ArrowLeft, 
  ShoppingBag, 
  Sparkles,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react'

interface ListingData {
  id: string
  priceCoins: number
  quantity: number
  createdAt: string
  frame: {
    id: string
    name: string
    description: string
    imageUrl: string
    thumbnailUrl: string
    rarity: string
    creator: {
      id: string
      name: string
      username: string
      avatar: string | null
      bio: string | null
      memberSince: string
      equippedFrame: {
        imageUrl: string
        rarity: string
      } | null
    }
  }
  seller: {
    id: string
    name: string
    username: string
    avatar: string | null
    bio: string | null
    memberSince: string
    equippedFrame: {
      imageUrl: string
      rarity: string
    } | null
  }
  sellerOtherListings: {
    id: string
    priceCoins: number
    quantity: number
    frame: {
      id: string
      name: string
      thumbnailUrl: string
      imageUrl: string
      rarity: string
    }
  }[]
}

const rarityDesigns = getRarityDesigns('static');

export default function ListingDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  const listingId = params.listing_id as string

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  useEffect(() => {
    fetch(`/api/cosmetics/listings/${listingId}`)
      .then(res => {
        if (!res.ok) throw new Error('Anúncio não encontrado')
        return res.json()
      })
      .then(data => {
        setListing(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [listingId])

  const handleBuy = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setBuying(true)
    setError('')

    try {
      const res = await fetch('/api/cosmetics/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing?.id,
          quantity: buyQuantity
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert('Compra realizada com sucesso!')
        router.push('/worldo/cosmetics/inventory')
      } else {
        setError(data.error || 'Erro ao processar compra')
      }
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-purple-400 text-sm font-bold uppercase tracking-widest animate-pulse">Buscando Oferta...</p>
      </div>
    )
  }
  

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4 opacity-80" />
        <h2 className="text-2xl font-black text-slate-200 mb-2">Oferta Não Encontrada</h2>
        <p className="text-slate-400 mb-6 max-w-md">Este anúncio não existe mais, foi comprado por outro usuário ou removido pelo vendedor.</p>
        <Link href="/worldo/cosmetics/marketplace" className="bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-white px-6 py-3 rounded-xl transition flex items-center gap-2 font-bold shadow-lg">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Marketplace
        </Link>
      </div>
    )
  }


  const config = rarityDesigns[listing.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">
        <Link href="/worldo/cosmetics/marketplace" className="hover:text-purple-400 transition flex items-center gap-1">
          <Store className="w-3.5 h-3.5" /> Marketplace
        </Link>
        <span>/</span>
        <span className={`${config.textClass} truncate max-w-50 sm:max-w-md`}>{listing.frame.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Lado Esquerdo: Preview com AvatarWithFrame */}
        <div className="lg:col-span-2">
          <div className={`relative rounded-3xl border overflow-hidden flex flex-col items-center justify-center p-8 min-h-100 h-full ${config.cardClass}`}>
            {/* Efeitos de fundo Premium */}
            {config.bgDecoration}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none" />
            
            <div className="z-10 relative flex flex-col items-center mt-auto mb-auto">
              <div className="mb-6 drop-shadow-2xl">
                <AvatarWithFrame
                  avatarUrl={session?.user?.avatar}
                  name={session?.user?.name}
                  frameUrl={listing.frame.imageUrl}
                  rarity={listing.frame.rarity}
                  className="w-40 h-40 md:w-48 md:h-48"
                  priority
                />
              </div>
              
              {/* Badge de Raridade Estilizado Abaixo do Avatar */}
              {config.badge}

              <p className="text-center text-xs text-slate-400/80 font-medium mt-6 bg-slate-950/40 px-4 py-1.5 rounded-full border border-slate-800/50 backdrop-blur-md">
                Preview aplicado ao seu avatar
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Informações do Anúncio */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Header do Item */}
          <div className="pb-6 border-b border-slate-800/60">
            <h1 className={`text-3xl sm:text-4xl font-black mb-3 ${config.textClass}`}>
              {listing.frame.name}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              {listing.frame.description}
            </p>
          </div>

          {/* Cards de Perfil (Vendedor & Criador) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* O VENDEDOR - AGORA REDIRECIONA PARA O CATÁLOGO DELE */}
            <Link 
              href={`/worldo/seller/${listing.seller.id}`} 
              className="group flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all relative overflow-hidden"
            >
              <AvatarWithFrame
                avatarUrl={listing.seller.avatar}
                name={listing.seller.name}
                frameUrl={listing.seller.equippedFrame?.imageUrl}
                rarity={listing.seller.equippedFrame?.rarity}
                size="sm"
              />
              <div className="flex-1 overflow-hidden z-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Store className="w-3 h-3 text-emerald-500" /> Vendedor
                </p>
                <p className="font-bold text-slate-200 group-hover:text-emerald-400 transition truncate">
                  {listing.seller.name}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors z-10" />
            </Link>

            {/* Criador Original - Redireciona para o Perfil Social */}
            <Link 
              href={`/worldo/perfil/${listing.frame.creator.username}`} 
              className="group flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/30 hover:bg-slate-800/50 transition-all"
            >
              <AvatarWithFrame
                avatarUrl={listing.frame.creator.avatar}
                name={listing.frame.creator.name}
                frameUrl={listing.frame.creator.equippedFrame?.imageUrl}
                rarity={listing.frame.creator.equippedFrame?.rarity}
                size="sm"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Criador Original
                </p>
                <p className="font-bold text-slate-200 group-hover:text-purple-400 transition truncate">
                  {listing.frame.creator.name}
                </p>
              </div>
              <User className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
            </Link>
          </div>

          {/* Área de Compra Glassmorphic */}
          <div className="p-6 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl mt-auto">
            <div className="flex items-end justify-between mb-6 pb-6 border-b border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Preço Unitário</p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-amber-400 drop-shadow-md">{listing.priceCoins}</span>
                  <Coins className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Estoque</p>
                <p className="text-xl font-bold text-white flex items-center gap-1.5 justify-end">
                  <Package className="w-4 h-4 text-slate-400" /> {listing.quantity}
                </p>
              </div>
            </div>


              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qtd.</label>
                    <input
                      type="number"
                      min="1"
                      max={listing.quantity}
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(Math.min(listing.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 text-center font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      disabled={buying}
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-right">Total a pagar</label>
                    <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-3.5 text-right font-black text-amber-400 flex justify-end items-center gap-2">
                      {listing.priceCoins * buyQuantity} <Coins className="w-4 h-4 text-amber-500/70" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBuy} 
                  disabled={buying}
                  className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-[transform,shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(147,51,234,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {buying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Finalizar Compra
                    </>
                  )}
                </button>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-lg flex items-center gap-2 justify-center">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}
              </div>
            

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-6 mt-4 border-t border-slate-800">
              <Calendar className="w-3 h-3" />
              <span>Listado em {new Date(listing.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outros anúncios do vendedor no padrão Premium */}
      {listing.sellerOtherListings.length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-black text-slate-200 flex items-center gap-2">
              <Store className="w-6 h-6 text-emerald-400" />
              Mais itens de {listing.seller.name}
            </h2>
            
            {/* BOTÃO VER CATÁLOGO DO VENDEDOR */}
            <Link 
              href={`/worldo/seller/${listing.seller.id}`} 
              className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
            >
              Ver Catálogo Completo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {listing.sellerOtherListings.map((item) => {
              const itemConfig = rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM

              return (
                <Link
                  key={item.id}
                  href={`/worldo/cosmetics/marketplace/${item.id}`}
                  className={`group relative flex flex-col items-center justify-between p-3 sm:p-4 h-60 sm:h-65 rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-[1.02] ${itemConfig.cardClass}`}
                >
                  {/* Efeitos de fundo */}
                  {itemConfig.bgDecoration}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05] pointer-events-none" />

                  {/* Header: Preço e Estoque */}
                  <div className="w-full flex justify-between items-start z-20 mb-2 gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm">
                      <Coins className="w-3 h-3" /> {item.priceCoins}
                    </span>
                    <span className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 font-black text-[10px] px-2 py-1 rounded-md shadow-lg shrink-0">
                      📦 x{item.quantity}
                    </span>
                  </div>

                  {/* Imagem */}
                  <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 shadow-xl ${itemConfig.borderClass}`}>
                    <ClientImage
                      src={item.frame.thumbnailUrl || item.frame.imageUrl}
                      alt={item.frame.name}
                      fill
                      className="object-cover drop-shadow-2xl"
                      sizes="(max-width: 640px) 96px, 112px"
                      unoptimized
                    />
                  </div>

                  {/* Pílula de Raridade */}
                  <div className="relative w-full flex justify-center z-20 mt-1 h-6">
                     <div className="scale-75 origin-top">
                       {itemConfig.badge}
                     </div>
                  </div>

                  {/* Nome */}
                  <div className="mt-auto w-full z-10 pt-2 border-t border-slate-800/40">
                    <span className={`block text-xs sm:text-sm text-center px-1 truncate drop-shadow-md ${itemConfig.textClass}`}>
                      {item.frame.name}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}