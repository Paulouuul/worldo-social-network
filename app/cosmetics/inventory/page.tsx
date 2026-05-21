'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Package, Tag, ShoppingBag, Plus, X, Loader2, Info, 
  AlertTriangle, Sparkles, Shield, Orbit, Layers, 
  Store, Box, Coins, MinusCircle, Edit2, ArrowLeft 
} from 'lucide-react'

// ... (Interfaces permanecem iguais)
interface InventoryItem {
  id: string
  frameId: string
  isListed: boolean
  resalePrice: number | null
  listingId?: string | null
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

interface GroupedItem extends InventoryItem {
  count: number
}

type FilterType = 'all' | 'listed' | 'unlisted'
type ModalMode = 'sell' | 'view' | 'edit' | 'remove' | null

// ... (rarityDesigns permanece igual)
const rarityDesigns: Record<string, {
  cardClass: string
  imgBorder: string
  textClass: string
  badge: React.ReactNode
  bgDecoration?: React.ReactNode
}> = {
  LENDARIO: {
    cardClass: 'border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] hover:border-amber-400/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    imgBorder: 'border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    textClass: 'text-amber-400 font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    badge: (
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.4)] border border-amber-300/60 z-20 whitespace-nowrap">
        <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} /> Lendário
      </span>
    ),
    bgDecoration: (
      <>
        <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      </>
    )
  },
  EPICO: {
    cardClass: 'border-purple-500/40 bg-gradient-to-br from-purple-900/30 via-slate-950 to-slate-950 shadow-[inset_0_0_15px_rgba(168,85,247,0.05)] hover:border-purple-400/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    imgBorder: 'border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    textClass: 'text-purple-300 font-extrabold tracking-wide',
    badge: (
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-purple-900/90 text-purple-200 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-purple-400/50 backdrop-blur-md z-20 whitespace-nowrap">
        <Orbit className="w-2.5 h-2.5 animate-pulse" /> Épico
      </span>
    ),
    bgDecoration: (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08)_0%,transparent_70%)]" />
    )
  },
  RARO: {
    cardClass: 'border-cyan-700/50 bg-gradient-to-b from-cyan-950/20 to-slate-950 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]',
    imgBorder: 'border-cyan-500/50',
    textClass: 'text-cyan-400 font-bold',
    badge: (
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-cyan-950/90 text-cyan-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border border-cyan-600/40 z-20 whitespace-nowrap">
        <Shield className="w-2 h-2" /> Raro
      </span>
    )
  },
  COMUM: {
    cardClass: 'border-slate-800/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60',
    imgBorder: 'border-slate-700/80',
    textClass: 'text-slate-400 font-medium',
    badge: (
      <span className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/90 text-slate-400 text-[8px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide border border-slate-700/50 z-20 whitespace-nowrap">
        <Layers className="w-2 h-2" /> Comum
      </span>
    )
  }
}

export default function MyCosmeticsPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('unlisted')
  
  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(100)
  
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasInitialized = useRef(false)
  
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png')
  
  // Lógica de raridade
  const rarityConfig = useMemo(() => {
    if (!selectedItem) return rarityDesigns.COMUM;
    return rarityDesigns[selectedItem.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;
  }, [selectedItem]);

  // ... (funções fetchInventory, useEffect, etc. permanecem iguais)
  const fetchInventory = async () => {
    try {
      const res = await fetch(`/api/cosmetics/inventory`)
      if (!res.ok) throw new Error('Falha ao sincronizar inventário')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error('Erro ao processar inventário:', err)
      setErrorMessage('Não foi possível atualizar seu inventário.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || hasInitialized.current) return
    hasInitialized.current = true
    fetchInventory()
  }, [session, status])
  useEffect(() => {
    if (!session?.user) return

    if (session.user.avatar) {
      setAvatarUrl(session.user.avatar)
    }

    if (!session.user.id) return

    const controller = new AbortController()
    
    fetch(`/api/user/${session.user.id}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.avatar) setAvatarUrl(data.avatar)
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err)
      })

    return () => controller.abort()
  }, [session])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000); // A mensagem sumirá após 3 segundos
      
      return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
    }
  }, [successMessage]);

  const fullInventoryList = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      const key = `${item.frameId}-${item.isListed}`
      if (!acc[key]) {
        acc[key] = { ...item, count: 0, listingId: item.listingId }
      }
      acc[key].count++
      return acc
    }, {} as Record<string, GroupedItem>)
    return Object.values(grouped)
  }, [items])

  const stats = useMemo(() => {
    const allItems = fullInventoryList.reduce((acc, item) => acc + item.count, 0)
    const listedItems = fullInventoryList.filter(item => item.isListed).reduce((acc, item) => acc + item.count, 0)
    const unlistedItems = allItems - listedItems
    return { all: allItems, listed: listedItems, unlisted: unlistedItems }
  }, [fullInventoryList])

  const displayedInventory = useMemo(() => {
    if (activeFilter === 'all') return fullInventoryList
    if (activeFilter === 'listed') return fullInventoryList.filter(item => item.isListed)
    return fullInventoryList.filter(item => !item.isListed)
  }, [fullInventoryList, activeFilter])

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
        await fetchInventory()
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
        await fetchInventory()
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
        await fetchInventory()
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

  if (status === 'loading' || (loading && status === 'authenticated')) {
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
      {/* ... (Cabeçalho, filtros e grid permanecem iguais) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-wide flex items-center gap-3">
            <Package className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 shrink-0" /> MEUS COSMÉTICOS
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">Gerencie seu inventário e comercialize suas molduras</p>
        </div>
        {fullInventoryList.length > 0 && (
          <Link 
            href="/cosmeticos/criar" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-300 py-3 sm:py-2.5 px-5 rounded-xl transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold shadow-lg shadow-purple-900/10"
          >
            <Plus className="w-4 h-4" /> Criar Nova Moldura
          </Link>
        )}
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-8 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1.5 w-full sm:w-fit shadow-inner backdrop-blur-sm">
        <button onClick={() => setActiveFilter('unlisted')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'unlisted' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Box className="w-4 h-4 shrink-0" /> <span className="hidden min-[400px]:inline">Disponíveis</span> <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{stats.unlisted}</span>
        </button>
        <button onClick={() => setActiveFilter('listed')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'listed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Store className="w-4 h-4 shrink-0" /> <span className="hidden min-[400px]:inline">No Mercado</span> <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{stats.listed}</span>
        </button>
        <button onClick={() => setActiveFilter('all')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-[transform,border-color,background-color,box-shadow] ${activeFilter === 'all' ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
          <Package className="w-4 h-4 shrink-0" /> Todos <span className="bg-slate-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{stats.all}</span>
        </button>
      </div>

      {/* Grid de itens */}
      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
          {displayedInventory.map((item) => {
            const config = rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM
            return (
              <button key={`${item.frameId}-${item.isListed}`} onClick={() => handleOpenItem(item)} className={`group relative h-48 sm:h-52 rounded-2xl border flex flex-col items-center justify-start pt-4 sm:pt-5 px-2 sm:px-3 pb-3 overflow-hidden transition-[transform,border-color,background-color,box-shadow] duration-150 cursor-pointer hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${config.cardClass} ${item.isListed ? 'ring-1 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : ''}`}>
                {item.isListed && (<div className="absolute top-2 left-2 z-20"><span className="flex items-center gap-1 text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.2)] tracking-wider uppercase"><Store className="w-2.5 h-2.5 hidden sm:block" /> Venda</span></div>)}
                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 font-black text-[10px] px-2 py-0.5 rounded-md shadow-md z-20">x{item.count}</div>
                {config.bgDecoration}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:0.4rem_0.4rem] opacity-[0.03]" />
                <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border shadow-inner bg-slate-900/80 flex items-center justify-center z-10 mb-3 ${config.imgBorder}`}><Image src={item.frame.thumbnailUrl} alt={item.frame.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 640px) 64px, 80px" unoptimized /></div>
                {config.badge}
                <span className={`text-[10px] sm:text-[11px] text-center z-10 px-0.5 mt-auto w-full truncate mb-1 ${config.textClass}`}>{item.frame.name}</span>
              </button>
            )
          })}
      </div>

      {/* MODAL TEMÁTICO */}
      {selectedItem && modalMode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          {/* O container principal agora usa o imgBorder dinâmico para borda e sombra */}
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

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar">
              
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

              {/* Preview Dinâmico */}
              <div className="flex flex-col items-center justify-center w-full mb-6">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-slate-800 z-0 bg-slate-800 flex items-center justify-center">
                    <Image 
                      src={avatarUrl} 
                      alt="Seu avatar" 
                      fill
                      sizes="128px"
                      className="object-cover"
                      priority
                      />
                  </div>
                  <div className="absolute w-48 h-48 z-10">
                    <img src={selectedItem.frame.imageUrl} alt="Moldura" className="w-full h-full object-contain pointer-events-none" />
                  </div>
                </div>
                {/* O Badge de ajuste agora respeita o esquema de cores da raridade */}
                <div className={`mt-8 px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${rarityConfig.imgBorder}`}>
                  <p className={`text-xs font-semibold tracking-wider uppercase ${rarityConfig.textClass}`}>Ajuste no Avatar</p>
                </div>
              </div>

              <div className="text-center mb-4">
                 {/* O título do item agora usa a classe de texto da raridade */}
                 <h3 className={`font-bold text-lg ${rarityConfig.textClass}`}>{selectedItem.frame.name}</h3>
                 <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">{selectedItem.frame.rarity}</p>
              </div>

              {/* Formulários (vão seguir o mesmo padrão de inputs já estabelecido) */}
              {/* ... (Os blocos de formulário permanecem iguais) */}
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