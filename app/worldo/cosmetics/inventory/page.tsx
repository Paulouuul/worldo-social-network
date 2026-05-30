'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ClientImage } from '@/components/ClientImage'
import Link from 'next/link'
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { 
  Package, Tag, Search, Plus, X, Loader2, Info, 
  AlertTriangle, Sparkles, Shield, Orbit, Layers, 
  Store, Box, Coins, MinusCircle, Edit2, ArrowLeft, ExternalLink
} from 'lucide-react'

interface GroupedItem {
  id: string
  frameId: string
  isListed: boolean
  resalePrice: number | null
  listingId?: string | null
  count: number
  frame: {
    id: string
    name: string
    description: string
    thumbnailUrl: string
    imageUrl: string
    rarity: string
    stock: number
  }
}

type FilterType = 'all' | 'listed' | 'unlisted'
type ModalMode = 'sell' | 'view' | 'edit' | 'remove' | null

const rarityDesigns = getRarityDesigns('bottom-10');

export default function MyCosmeticsPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<GroupedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('unlisted')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [statsData, setStatsData] = useState({ all: 0, listed: 0, unlisted: 0 })
  
  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(100)
  
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png')
  
  const rarityConfig = useMemo(() => {
    if (!selectedItem) return rarityDesigns.COMUM;
    return rarityDesigns[selectedItem.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;
  }, [selectedItem]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/cosmetics/inventory/stats')
      const data = await res.json()
      setStatsData(data)
    } catch (err) {
      console.error('Erro ao buscar stats:', err)
    }
  }, []);

  const fetchInventory = useCallback(async (page: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      const res = await fetch(`/api/cosmetics/inventory/grouped?page=${page}&limit=50&filter=${activeFilter}&search=${encodeURIComponent(searchTerm)}&rarity=${rarityFilter}&sort=${sort}`)
      if (!res.ok) throw new Error('Falha ao sincronizar inventário')
      
      const data = await res.json()
      
      if (isLoadMore) {
        setItems(prev => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }
      
      setHasMore(data.pagination.hasNextPage)
      setCurrentPage(page)
      
    } catch (err) {
      console.error('Erro ao processar inventário:', err)
      setErrorMessage('Não foi possível atualizar seu inventário.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeFilter, searchTerm, rarityFilter, sort]);

  // Carrega avatar apenas uma vez quando houver a sessão do usuário
  useEffect(() => {
    if (!session?.user) return

    if (session.user.avatar) {
      setAvatarUrl(session.user.avatar)
    }

    if (!session.user.id) return

    const controller = new AbortController()
    
    fetch(`/api/user/${session.user.publicId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.avatar) setAvatarUrl(data.avatar)
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err)
      })

    return () => controller.abort()
  }, [session])

  // Limpa mensagens de sucesso sozinhas
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000); 
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Hook unificado com DEBOUNCE para evitar requisições infinitas na digitação
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    fetchStats();

    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      setItems([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchInventory(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeFilter, searchTerm, rarityFilter, sort, status, session, fetchStats, fetchInventory]);

  // Intersection Observer para o Scroll Infinito
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchInventory(currentPage + 1, true)
        }
      },
      { threshold: 0.1 }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => observer.disconnect()
  }, [loading, loadingMore, hasMore, currentPage, fetchInventory])

  const handleOpenItem = (item: GroupedItem) => {
    setSelectedItem(item)
    setErrorMessage('')
    setSuccessMessage('')
    
    if (item.isListed) {
      setModalMode('view')
      setPrice(item.resalePrice || 100)
      setQuantity(item.count)
    } else {
      setModalMode('sell')
      setQuantity(1)
      setPrice(item.frame.stock > 0 ? 100 : 50)
    }
  }

  const closeModal = () => {
    if (submitting) return
    setModalMode(null)
    setSelectedItem(null)
  }

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || submitting) return
    if (quantity > selectedItem.count) {
      setErrorMessage(`Você possui apenas ${selectedItem.count} unidades desta moldura.`)
      return
    }
    if (price <= 0) {
      setErrorMessage('O preço precisa ser maior que zero.')
      return
    }
    setSubmitting(true)
    setErrorMessage('')
    
    try {
      const res = await fetch('/api/cosmetics/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId: selectedItem.frameId, quantity, priceCoins: price })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMessage('Anúncio publicado no mercado!')
        await fetchInventory(1, false)
        await fetchStats()
        setTimeout(closeModal, 1500)
      } else {
        setErrorMessage(data.error || 'Erro na validação do anúncio.')
      }
    } catch (err) {
      setErrorMessage('Erro de comunicação com o servidor.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem?.listingId || submitting) return

    setSubmitting(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/cosmetics/listings/update-price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedItem.listingId, priceCoins: price })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMessage('Preço atualizado com sucesso!')
        await fetchInventory(1, false)
        setSelectedItem({ ...selectedItem, resalePrice: price })
        setTimeout(() => setModalMode('view'), 1000)
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar preço')
      }
    } catch (err) {
      setErrorMessage('Erro de comunicação com o servidor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveItems = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem?.listingId || submitting) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/cosmetics/listings/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedItem.listingId, quantity: quantity })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMessage(`${quantity} unidade(s) retiradas do mercado!`)
        await fetchInventory(1, false)
        await fetchStats()
        if (quantity >= selectedItem.count) {
          setTimeout(closeModal, 1500)
        } else {
          const remainingCount = selectedItem.count - quantity
          setSelectedItem({ ...selectedItem, count: remainingCount })
          setTimeout(() => {
            setModalMode('view')
            setSuccessMessage('')
          }, 1500)
        }
      } else {
        setErrorMessage(data.error || 'Erro ao remover do mercado')
      }
    } catch (err) {
      setErrorMessage('Erro de comunicação com o servidor')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || (loading && status === 'authenticated' && items.length === 0)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">Acessando cofre de cosméticos...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm shadow-xl">
          <Info className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-slate-200 font-medium">Autenticação Requerida</p>
          <Link href="/login" className="inline-block mt-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm py-2 px-6 rounded-xl transition shadow-lg shadow-purple-900/20">
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12 relative min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-wide flex items-center gap-3">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 shrink-0" /> MEUS COSMÉTICOS
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">Gerencie seu inventário e comercialize suas molduras</p>
        </div>
        {items.length > 0 && (
          <Link 
            href="/worldo/cosmetics/create" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-300 py-3 sm:py-2.5 px-5 rounded-xl transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold shadow-lg shadow-purple-900/10"
          >
            <Plus className="w-4 h-4" /> Criar Nova Moldura
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
           <button
            onClick={() => setSearchTerm(searchInput)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
          >
            <Search className="w-4 h-4 text-slate-500" />
          </button>
          <input
            type="text"
            placeholder="Buscar no inventário..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
            <button
              onClick={() => {
                setSearchInput('')
                setSearchTerm('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'COMUM', 'RARO', 'EPICO', 'LENDARIO'].map((rarity) => (
            <button
              key={rarity}
              onClick={() => setRarityFilter(rarity)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                rarityFilter === rarity
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {rarity === 'all' ? 'Todas' : rarity}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-8 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5 w-full sm:w-fit shadow-inner backdrop-blur-sm">
        <button onClick={() => setActiveFilter('unlisted')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'unlisted' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Box className="w-4 h-4 shrink-0" /> <span className="hidden min-[400px]:inline">Disponíveis</span> <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{statsData.unlisted}</span>
        </button>
        <button onClick={() => setActiveFilter('listed')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'listed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Store className="w-4 h-4 shrink-0" /> <span className="hidden min-[400px]:inline">No Mercado</span> <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{statsData.listed}</span>
        </button>
        <button onClick={() => setActiveFilter('all')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'all' ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Package className="w-4 h-4 shrink-0" /> Todos <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{statsData.all}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 font-medium mr-2">Ordenar por:</span>
        <button
          onClick={() => setSort('newest')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'newest' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Mais recentes
        </button>
        <button
          onClick={() => setSort('oldest')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            sort === 'oldest' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          Mais antigos
        </button>
      </div>

      <div className="relative min-h-[400px]">
        {loading && items.length === 0 && (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-48 sm:h-52 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
            <Package className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">Seu inventário está vazio</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Adquira no marketplace ou crie sua própria moldura!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/worldo/cosmetics/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
              >
                <Store className="w-4 h-4" />
                Ir ao Marketplace
              </Link>
              <Link 
                href="/worldo/cosmetics/create"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20"
              >
                <Plus className="w-4 h-4" />
                Criar moldura
              </Link>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
              {items.map((item) => {
                const config = rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM
                return (
                  <button key={`${item.frameId}-${item.isListed}`} onClick={() => handleOpenItem(item)} className={`group relative h-48 sm:h-52 rounded-2xl border flex flex-col items-center justify-start pt-4 sm:pt-5 px-2 sm:px-3 pb-3 overflow-hidden transition-[transform,border-color,background-color,box-shadow] duration-150 cursor-pointer hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${config.cardClass} ${item.isListed ? 'ring-1 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : ''}`}>
                    {item.isListed && (<div className="absolute top-2 left-2 z-20"><span className="flex items-center gap-1 text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.2)] tracking-wider uppercase"><Store className="w-2.5 h-2.5 hidden sm:block" /> Venda</span></div>)}
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 font-black text-[10px] px-2 py-0.5 rounded-md shadow-md z-20">x{item.count}</div>
                    {config.bgDecoration}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:0.4rem_0.4rem] opacity-[0.03]" />
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border shadow-inner bg-slate-900/80 flex items-center justify-center z-10 mb-3 ${config.imgBorder}`}><ClientImage src={item.frame.thumbnailUrl} alt={item.frame.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 640px) 64px, 80px" unoptimized /></div>
                    {config.badge}
                    <span className={`text-[10px] sm:text-[11px] text-center z-10 px-0.5 mt-auto w-full truncate mb-1 ${config.textClass}`}>{item.frame.name}</span>
                  </button>
                )
              })}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            )}

            {hasMore && !loading && !loadingMore && (
              <div ref={loadMoreRef} className="h-10" />
            )}
          </>
        )}
      </div>

      {selectedItem && modalMode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className={`bg-slate-900 border ${rarityConfig.imgBorder} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]`}>
            
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2">
                {modalMode === 'sell' && <><Tag className="w-4 h-4 text-purple-400 shrink-0" /><h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">Criar Ordem de Venda</h2></>}
                {modalMode === 'view' && <><Store className="w-4 h-4 text-emerald-400 shrink-0" /><h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">Detalhes do Anúncio</h2></>}
                {modalMode === 'edit' && <><Edit2 className="w-4 h-4 text-indigo-400 shrink-0" /><h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">Editar Preço</h2></>}
                {modalMode === 'remove' && <><MinusCircle className="w-4 h-4 text-rose-400 shrink-0" /><h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">Retirar do Mercado</h2></>}
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-300 transition p-1 shrink-0" disabled={submitting}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
              
              {errorMessage && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-3 text-xs flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0 mt-1.5 animate-ping" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center w-full mb-6">
                <AvatarWithFrame 
                  avatarUrl={avatarUrl}              
                  name={session?.user?.name} 
                  frameUrl={selectedItem.frame.imageUrl} 
                  className="w-28 h-28 md:w-36 md:h-36"
                  rarity={selectedItem.frame.rarity}
                  priority
                />
              </div>

              <div className="text-center mb-4">
                 <h3 className={`font-bold text-lg ${rarityConfig.textClass}`}>{selectedItem.frame.name}</h3><br/>
                 <p className={`text-xs font-semibold tracking-wider uppercase ${rarityConfig.textClass}`}>------------------------</p>
                  <p className={`text-xs font-semibold tracking-wider uppercase ${rarityConfig.textClass}`}>{selectedItem.frame.rarity}</p>
                  <p className={`text-xs font-semibold tracking-wider uppercase ${rarityConfig.textClass}`}>------------------------</p>
              </div>

              {modalMode === 'view' && (
                <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-right-4 duration-200">
                  <div className="bg-slate-950/50 rounded-xl p-3 sm:p-4 border border-slate-800/50 flex flex-col gap-2 sm:gap-3 shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço Unitário:</span>
                      <span className="text-sm font-black text-amber-500 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> {selectedItem.resalePrice}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Rendimento Previsto:</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> {(selectedItem.resalePrice || 0) * selectedItem.count}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <button onClick={() => { setModalMode('edit'); setPrice(selectedItem.resalePrice || 100); setErrorMessage(''); setSuccessMessage(''); }} className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-semibold text-sm py-3 sm:py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Editar Preço</button>
                    <button onClick={() => { setModalMode('remove'); setQuantity(selectedItem.count); setErrorMessage(''); setSuccessMessage(''); }} className="flex-1 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-semibold text-sm py-3 sm:py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] flex items-center justify-center gap-2"><MinusCircle className="w-4 h-4" /> Retirar Lote</button>
                  </div>
                  {selectedItem.listingId && (
                  <Link
                    href={`/worldo/cosmetics/marketplace/${selectedItem.listingId}`}
                    className="flex items-center justify-center gap-2 w-full bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver anúncio público
                  </Link>
                )}
                </div>
              )}

              {modalMode === 'sell' && (
                <form onSubmit={handleSell} className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box className="w-3 h-3" /> Qtd. a Listar</label>
                      <input type="number" min="1" max={selectedItem.count} value={quantity} onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.count))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold" disabled={submitting} required />
                    </div>
                    <div>
                      <label className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Coins className="w-3 h-3 text-amber-500" /> Preço Un. (🪙)</label>
                      <input type="number" min="1" value={price} onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold" disabled={submitting} required />
                    </div>
                  </div>
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 sm:p-3.5 flex justify-between items-center text-xs"><span className="text-slate-400 font-medium text-[10px] sm:text-xs">Rendimento Total:</span><span className="font-black text-purple-400 text-sm flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {new Intl.NumberFormat('pt-BR').format(quantity * price)}</span></div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60"><button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Store className="w-4 h-4" /> Anunciar no Mercado</>}</button><button type="button" onClick={closeModal} disabled={submitting} className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancelar</button></div>
                </form>
              )}

              {modalMode === 'edit' && (
                <form onSubmit={handleUpdatePrice} className="space-y-4 animate-in slide-in-from-left-4 duration-200">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Coins className="w-3 h-3 text-amber-500" /> Novo Preço Unitário</label>
                    <input type="number" min="1" value={price} onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-amber-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold" disabled={submitting} required />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60"><button type="submit" disabled={submitting || price === selectedItem.resalePrice} className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alteração'}</button><button type="button" onClick={() => setModalMode('view')} disabled={submitting} className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</button></div>
                </form>
              )}

              {modalMode === 'remove' && (
                <form onSubmit={handleRemoveItems} className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box className="w-3 h-3" /> Qtd. a Retirar para o Cofre</label>
                    <input type="number" min="1" max={selectedItem.count} value={quantity} onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.count))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold" disabled={submitting} required />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60"><button type="submit" disabled={submitting} className="flex-[1.5] bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Retirada'}</button><button type="button" onClick={() => setModalMode('view')} disabled={submitting} className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}