'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ClientImage } from '@/components/ClientImage' 
import { AvatarWithFrame } from '@/components/AvatarWithFrame'
import { 
  Sparkles, 
  FileText, 
  Layers, 
  Package, 
  UploadCloud, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  X, 
  Image as ImageIcon 
} from 'lucide-react'

// 1. Mapeamento de estilos dinâmicos por raridade (constante fora do componente)
const rarityStyles: Record<string, {
  text: string
  border: string
  bgAlpha: string
  focusRing: string
  glow: string
  gradientHeader: string
  gradientText: string
  buttonSubmit: string
}> = {
  COMUM: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bgAlpha: 'from-emerald-950/20 via-transparent to-transparent',
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-500/30',
    glow: 'drop-shadow-[0_10px_20px_rgba(16,185,129,0.2)]',
    gradientHeader: 'from-slate-950 via-emerald-950/40 to-slate-950',
    gradientText: 'from-emerald-400 via-teal-400 to-cyan-400',
    buttonSubmit: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
  },
  RARO: {
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    bgAlpha: 'from-blue-900/20 via-transparent to-transparent',
    focusRing: 'focus:border-blue-500 focus:ring-blue-500/30',
    glow: 'drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]',
    gradientHeader: 'from-slate-950 via-blue-950/50 to-slate-950',
    gradientText: 'from-blue-400 via-cyan-400 to-indigo-400',
    buttonSubmit: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'
  },
  EPICO: {
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    bgAlpha: 'from-purple-900/20 via-transparent to-transparent',
    focusRing: 'focus:border-purple-500 focus:ring-purple-500/30',
    glow: 'drop-shadow-[0_10px_20px_rgba(147,51,234,0.3)]',
    gradientHeader: 'from-purple-950/60 via-indigo-950/40 to-slate-950',
    gradientText: 'from-purple-400 via-pink-400 to-indigo-400',
    buttonSubmit: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/20'
  },
  LENDARIO: {
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    bgAlpha: 'from-amber-900/20 via-transparent to-transparent',
    focusRing: 'focus:border-amber-500 focus:ring-amber-500/30',
    glow: 'drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]',
    gradientHeader: 'from-slate-950 via-amber-950/40 to-yellow-950/20',
    gradientText: 'from-amber-400 via-orange-400 to-yellow-400',
    buttonSubmit: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/20'
  }
}

// Constantes fora do componente
const stockPackages = [
  { value: 10, label: 'Pacote Básico', units: '10 unidades', multiplier: 1, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300' },
  { value: 50, label: 'Pacote Comercial', units: '50 unidades', multiplier: 1.5, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300' },
  { value: 100, label: 'Pacote Empresarial', units: '100 unidades', multiplier: 2, color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300' },
  { value: 500, label: 'Pacote Máster', units: '500 unidades', multiplier: 5, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300' },
]

const baseCosts: Record<string, number> = {
  COMUM: 50,
  RARO: 200,
  EPICO: 500,
  LENDARIO: 1000,
}


// Componente de Loading isolado
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      <span className="ml-3 text-purple-300 font-medium">Carregando portal...</span>
    </div>
  )
}

// Componente de Preview isolado
function PreviewCarousel({ 
  hasFramePreview, 
  hasThumbPreview, 
  imagePreview, 
  thumbnailPreview, 
  avatarUrl, 
  currentStyle 
}: {
  hasFramePreview: boolean
  hasThumbPreview: boolean
  imagePreview: string
  thumbnailPreview: string
  avatarUrl: string
  currentStyle: typeof rarityStyles.COMUM
}) {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const totalSlides = (hasFramePreview ? 1 : 0) + (hasThumbPreview ? 1 : 0)

  const toggleSlide = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // Previne comportamento padrão
    setCarouselIndex(prev => (prev === 0 ? 1 : 0))
  }, [])

  // Previne double click nos botões de navegação
  const handleSlideButton = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setCarouselIndex(index)
  }, [])

  return (
    <div className="relative group">
      <div className={`bg-slate-950/90 rounded-2xl border ${currentStyle.border} overflow-hidden shadow-2xl relative min-h-[380px] flex items-center justify-center transition-all duration-500`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />
        
        <div className={`transition-all duration-300 absolute inset-0 flex flex-col items-center justify-center p-6 h-full ${carouselIndex === 0 && hasFramePreview ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          {hasFramePreview && (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-purple-500/20 z-0">
                  <ClientImage 
                    src={avatarUrl} 
                    alt="Seu avatar" 
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className={`absolute w-48 h-48 z-10 ${currentStyle.glow} animate-float transition-all duration-500`}>
                  <ClientImage 
                    src={imagePreview} 
                    alt="Moldura Cosmética" 
                    fill
                    sizes="192px"
                    unoptimized
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className={`mt-8 bg-purple-500/10 px-4 py-1.5 rounded-full border ${currentStyle.border} shadow-sm backdrop-blur-md`}>
                <p className={`text-xs font-semibold tracking-wider ${currentStyle.text} uppercase`}>Ajuste no Avatar</p>
              </div>
            </div>
          )}
        </div>
        
        <div className={`transition-all duration-300 absolute inset-0 flex flex-col items-center justify-center p-6 h-full ${carouselIndex === 1 || (!hasFramePreview && hasThumbPreview) ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          {hasThumbPreview && (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ring-4 ring-indigo-500/10">
                <ClientImage 
                  src={thumbnailPreview} 
                  alt="Miniatura Comercial" 
                  fill
                  sizes="176px"
                  unoptimized
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mt-8 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm backdrop-blur-md">
                <p className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">Card de Vitrine</p>
              </div>
            </div>
          )}
        </div>
        
        {totalSlides > 1 && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
            <button 
              type="button" 
              onClick={toggleSlide}
              onDoubleClick={(e) => e.preventDefault()} 
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 pointer-events-auto backdrop-blur-sm transition-all active:scale-95 select-none"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={toggleSlide}
              onDoubleClick={(e) => e.preventDefault()} 
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 pointer-events-auto backdrop-blur-sm transition-all active:scale-95 select-none"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {totalSlides > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          <button 
            type="button"
            onClick={handleSlideButton(0)}
            onDoubleClick={(e) => e.preventDefault()}
            className={`h-1.5 rounded-full transition-all duration-300 ${carouselIndex === 0 ? 'w-6 bg-purple-500' : 'w-2 bg-slate-800'} select-none`}
            aria-label="Slide 1"
          />
          <button 
            type="button"
            onClick={handleSlideButton(1)}
            onDoubleClick={(e) => e.preventDefault()}
            className={`h-1.5 rounded-full transition-all duration-300 ${carouselIndex === 1 ? 'w-6 bg-purple-500' : 'w-2 bg-slate-800'} select-none`}
            aria-label="Slide 2"
          />
        </div>
      )}
    </div>
  )
}

export default function CreateCosmeticPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'COMUM',
    stock: 10,
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png')
  const [showFramePreview, setShowFramePreview] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(false);


  // Memoized values
  const currentStyle = useMemo(() => 
    rarityStyles[formData.rarity] || rarityStyles.COMUM, 
    [formData.rarity]
  )

  const currentPackage = useMemo(() => 
    stockPackages.find(pkg => pkg.value === formData.stock),
    [formData.stock]
  )

  const creationCost = useMemo(() => {
    const baseCost = baseCosts[formData.rarity] || 50
    const multiplier = currentPackage?.multiplier || 1
    return Math.floor(baseCost * multiplier)
  }, [formData.rarity, currentPackage])

  const hasFramePreview = showFramePreview && !!imagePreview
  const hasThumbPreview = !!thumbnailPreview

  // Efeito para desabilitar double click globalmente
  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      // Previne double click em toda a página
      e.preventDefault()
    }

    // Adiciona o listener para double click
    document.addEventListener('dblclick', handleDoubleClick)

    // Também desabilita seleção de texto para evitar seleção acidental em double click
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick)
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }
  }, [])

  // Efeito para buscar avatar - otimizado com cleanup
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

  // Limpeza de URLs
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [imagePreview, thumbnailPreview])

  // Handlers otimizados com useCallback
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, GIF ou WEBP.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setShowFramePreview(true)
    setError('')
  }, [])

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, GIF ou WEBP.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    setError('')
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Previne double submit
    if (loading) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    if (!imageFile) {
      setError('Selecione uma imagem para a moldura')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setLoading(false)
      return
    }

    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('description', formData.description)
    submitData.append('rarity', formData.rarity)
    submitData.append('stock', formData.stock.toString())
    submitData.append('image', imageFile)
    
    if (thumbnailFile) {
      submitData.append('thumbnail', thumbnailFile)
    }

    try {
      const res = await fetch('/api/cosmetics/create', {
        method: 'POST',
        body: submitData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar moldura')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setLoading(false) // Só reabilita o botão em caso de erro
      } else {
        setSuccess(data.message || 'Moldura criada com sucesso!')
        // Redireciona imediatamente sem reabilitar o botão
        router.push('/worldo/cosmetics/inventory')
        // Não chamamos setLoading(false) aqui - o botão continua desabilitado
      }
    } catch {
      setError('Erro ao conectar com o servidor')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setLoading(false) // Só reabilita o botão em caso de erro
    }
  }, [imageFile, thumbnailFile, formData, router, loading])

  // Handler para pacotes com prevenção de double click
  const handleStockPackageClick = useCallback((value: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setFormData(prev => ({ ...prev, stock: value }))
  }, [])
  
  if (status === 'loading') {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 select-none">
      <div className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border ${currentStyle.border} shadow-2xl transition-all duration-500`}>
        
        <div className={`relative h-36 bg-gradient-to-r ${currentStyle.gradientHeader} flex flex-col items-center justify-center border-b ${currentStyle.border} px-4 text-center transition-all duration-500`}>
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${currentStyle.bgAlpha} opacity-60 transition-all duration-500`} />
          <h1 className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${currentStyle.gradientText} flex items-center gap-2 z-10 tracking-wide transition-all duration-500`}>
            <Sparkles className={`w-6 h-6 ${currentStyle.text} animate-pulse`} />
            FORJAR NOVA MOLDURA
          </h1>
          <p className="text-slate-400 text-sm mt-2 z-10 max-w-md">
            Crie artefatos exclusivos para customização cosmética e distribua na rede.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20 flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-red-500 block" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl mb-6 text-sm border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
              {success}
            </div>
          )}

          <div className="flex flex-col space-y-8">
            
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              
              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                  <FileText className={`w-4 h-4 ${currentStyle.text}`} /> Nome da Moldura
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none ${currentStyle.focusRing} focus:ring-1 transition-all`}
                  required
                  placeholder="Ex: Singularidade Estelar"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                  <FileText className={`w-4 h-4 ${currentStyle.text}`} /> Descrição do Artefato
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none ${currentStyle.focusRing} focus:ring-1 transition-all resize-none`}
                  rows={3}
                  placeholder="Descreva a história ou efeitos visuais desta moldura..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <Layers className={`w-4 h-4 ${currentStyle.text}`} /> Nível de Raridade
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                    className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none ${currentStyle.focusRing} focus:ring-1 transition-all cursor-pointer`}
                  >
                    <option value="COMUM">🟢 Comum</option>
                    <option value="RARO">🔵 Raro</option>
                    <option value="EPICO">🟣 Épico</option>
                    <option value="LENDARIO">🟠 Lendário</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <Package className={`w-4 h-4 ${currentStyle.text}`} /> Lote de Upload
                  </label>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 text-sm flex items-center h-[46px]">
                    {currentPackage?.units || 'Selecione um pacote abaixo'}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-3 font-semibold text-sm tracking-wide uppercase">
                  <Package className={`w-4 h-4 ${currentStyle.text}`} /> Seleção do Pacote de Distribuição
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stockPackages.map((pkg) => {
                    const isSelected = formData.stock === pkg.value
                    return (
                      <button
                        key={pkg.value}
                        type="button"
                        onClick={handleStockPackageClick(pkg.value)}
                        onDoubleClick={(e) => e.preventDefault()}
                        className={`relative text-left p-4 rounded-xl border transition-all duration-200 bg-gradient-to-br hover:border-purple-500/50 select-none ${
                          isSelected 
                            ? `${pkg.color} ring-1 ring-purple-500/30 shadow-lg border-transparent` 
                            : 'from-slate-950/40 to-slate-900/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {pkg.label}
                            </div>
                            <div className="text-xs mt-0.5 opacity-80">{pkg.units}</div>
                            <div className="text-[11px] mt-2 opacity-60 italic">
                              Multiplicador de Custo: {pkg.multiplier}x
                            </div>
                          </div>
                          {isSelected && (
                            <div className="p-1 bg-purple-500/30 rounded-full text-white">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <ImageIcon className={`w-4 h-4 ${currentStyle.text}`} /> Camada da Moldura (PNG)
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 hover:${currentStyle.border} rounded-xl p-4 bg-slate-950/40 text-slate-300 text-sm font-medium transition-all cursor-pointer text-center group min-h-[90px] select-none`}
                  >
                    <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    <span>{imageFile ? 'Alterar Ativo Principal' : 'Carregar Moldura Transparente'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Recomendado PNG transparente. A arte pode extrapolar as dimensões do avatar circular.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <ImageIcon className={`w-4 h-4 ${currentStyle.text}`} /> Miniatura Comercial (Opcional)
                  </label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className={`flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 hover:${currentStyle.border} rounded-xl p-4 bg-slate-950/40 text-slate-300 text-sm font-medium transition-all cursor-pointer text-center group min-h-[90px] select-none`}
                  >
                    <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    <span>{thumbnailFile ? 'Alterar Miniatura' : 'Carregar Card de Vitrine'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Imagem quadrada utilizada para exibição em feeds compactos e listagens da loja.
                  </p>
                </div>
              </div>

              <div className={`bg-slate-950/60 rounded-xl p-5 border ${currentStyle.border} space-y-3 transition-all duration-500`}>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-slate-500" /> Custo Base ({formData.rarity})</span>
                  <span className="font-semibold text-slate-200">{baseCosts[formData.rarity] || 50} moedas</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-slate-500" /> Multiplicador do Lote</span>
                  <span className="font-semibold text-slate-200">{currentPackage?.multiplier}x ({currentPackage?.units})</span>
                </div>
                <div className="border-t border-slate-800/80 my-2 pt-2 flex justify-between items-center">
                  <span className={`text-sm font-semibold ${currentStyle.text} transition-colors duration-500`}>Custo de Emissão do Contrato</span>
                  <span className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentStyle.gradientText} transition-all duration-500`}>
                    {creationCost} moedas
                  </span>
                </div>
              </div>

                          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
 <div className={`bg-slate-950/40 rounded-2xl p-8 border ${currentStyle.border} text-center transition-all duration-500`}>
  
  {/* Header Centralizado */}
  <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-10 flex items-center justify-center gap-2">
    <Sparkles className={`w-4 h-4 ${currentStyle.text}`} /> 
    Galeria de Visualização
  </h3>
  
  {imagePreview ? (
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
      
      {/* PAINEL 1: Moldura de Perfil (O principal) */}
      <div className="flex-1 bg-slate-950/60 rounded-xl p-8 border border-slate-900 shadow-xl flex flex-col items-center justify-between gap-6">
        
        {/* Componente Principal */}
        <div className="relative min-h-[160px] flex items-center justify-center">
          <AvatarWithFrame
            avatarUrl={avatarUrl && avatarUrl !== "None" ? avatarUrl : null} 
            name={session?.user?.name}
            frameUrl={imagePreview}
            rarity={formData.rarity}
            size="md" // Aumentei um pouco o tamanho para destacar
            glowClass={currentStyle.glow}
            priority
          />
        </div>

        {/* Etiqueta de Identificação */}
        <div className={`bg-purple-500/10 px-4 py-1.5 rounded-full border ${currentStyle.border} shadow-sm backdrop-blur-md`}>
          <p className={`text-xs font-semibold tracking-wider ${currentStyle.text} uppercase`}>
            Visualização no Perfil
          </p>
        </div>
      </div>

      {/* PAINEL 2: Miniatura (Aparece se existir thumbnailPreview) */}
      {thumbnailPreview && (
        <div className="flex-1 bg-slate-950/60 rounded-xl p-8 border border-slate-900 shadow-xl flex flex-col items-center justify-between gap-6">
          
          {/* Container da Miniatura */}
          <div className="relative group">
            {/* Efeito de brilho de fundo na miniatura (hover) */}
            <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r ${currentStyle.glow} opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur`}></div>
            
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <ClientImage
                src={thumbnailPreview}
                alt="Miniatura"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Etiqueta de Identificação */}
          <div className={`bg-slate-800/40 px-4 py-1.5 rounded-full border border-slate-800 shadow-sm backdrop-blur-md`}>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Formato Lista / Grid
            </p>
          </div>
        </div>
      )}

    </div>
  ) : (
    // ESTADO VAZIO (Mantido e ajustado para o design novo)
    <div className="bg-slate-950/60 rounded-xl p-16 border border-slate-900 flex flex-col items-center justify-center min-h-[360px]">
      <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-600 mb-6 shadow-inner">
        <ImageIcon className="w-10 h-10" />
      </div>
      <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
        Selecione uma imagem para visualizar como o cosmético ficará no perfil e nas listas do sistema.
      </p>
    </div>
  )}
</div>
</div>

                           
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  onDoubleClick={(e) => e.preventDefault()}
                  className={`bg-gradient-to-r ${currentStyle.buttonSubmit} text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-1 text-center tracking-wide select-none`}
                >
                  {loading ? 'FORJANDO ATIVO...' : 'CONFIRMAR CRIAÇÃO'}
                </button>
                <Link 
                  href="/cosmeticos"
                  onDoubleClick={(e) => e.preventDefault()}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:flex-1 text-center select-none"
                >
                  <X className="w-4 h-4" /> CANCELAR
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}