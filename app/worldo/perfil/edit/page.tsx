'use client'

import { useRef, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClientImage } from '@/components/ClientImage' 
import { Sparkles, User, AtSign, FileText, MapPin, Link2, Upload, Trash2, Save, X } from 'lucide-react'

export default function EditProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (session?.user?.id && !hasFetched.current) {
      hasFetched.current = true

      setFormData({
        name: session.user.name || '',
        username: session.user.username || '',
        avatar: session.user.avatar || '',
        bio: '',
        location: '',
        website: '',
      })
      setAvatarPreview(session.user.avatar || '')
      
      fetch(`/api/user/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setFormData(prev => ({
            ...prev,
            username: data.username || prev.username,
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            avatar: data.avatar || prev.avatar,
          }))
          setAvatarPreview(data.avatar || session.user.avatar || '')
        })
        .catch(err => console.error("Erro ao buscar dados complementares:", err))
    }
  }, [session])

  // Evita flash de conteúdo antes da checagem de autenticação terminar
  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 mt-4 text-purple-300 font-medium text-sm">Sincronizando terminal...</span>
      </div>
    )
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, GIF ou WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      return
    }

    // CORREÇÃO 2: Evita Memory Leak revogando a URL anterior se ela existir
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }

    setAvatarFile(file)
    setRemoveAvatar(false)
    
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setError('')
  }

  const handleRemoveAvatar = () => {
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    
    setAvatarFile(null)
    setRemoveAvatar(true)
    setAvatarPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('username', formData.username.trim())
      submitData.append('bio', formData.bio)
      submitData.append('location', formData.location)
      submitData.append('website', formData.website)
      
      if (avatarFile) {
        submitData.append('avatar', avatarFile)
      }
      
      if (removeAvatar) {
        submitData.append('removeAvatar', 'true')
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        body: submitData, 
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar perfil')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setSuccess('Perfil atualizado com sucesso!')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        await update({
          ...session,
          user: { 
            ...session.user, 
            ...data.user,
            avatar: data.user?.avatar || "None", 
          }
        })
        
        setAvatarFile(null)
        setRemoveAvatar(false)
        
        // setTimeout(() => {
        //   router.push(`/worldo/perfil/${data.user?.username || formData.username}`)
        //   router.refresh()
        // }, 1200)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/worldo/perfil/${formData.username || session.user?.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Background Aurora / Efeito de Fundo Cósmico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800/60 pb-5">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 tracking-wide uppercase">
              Modificar Perfil
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Ajuste suas informações públicas e credenciais de exibição</p>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-xs border border-red-500/20 flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-6 text-xs border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <label className="flex items-center gap-1.5 text-slate-300 mb-3 font-semibold text-xs tracking-wide uppercase">
              Avatar de Rede
            </label>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 bg-slate-950 shrink-0 shadow-inner">
                {avatarPreview && avatarPreview !== "None" ? (
                  <ClientImage
                    src={avatarPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl to-indigo-600 text-white font-black">
                    ?
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={loading}
                />
                
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" /> Transmitir foto
                  </label>
                  
                  {avatarPreview && avatarPreview !== "None" && !removeAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                      disabled={loading}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Suportados: JPG, PNG, GIF ou WEBP. Tamanho máximo permitido: 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Inputs de Texto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <AtSign className="w-3.5 h-3.5 text-purple-400" /> Usuário de Acesso
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                required
                disabled={loading}
                placeholder="usuario_123"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <User className="w-3.5 h-3.5 text-purple-400" /> Nome de Exibição
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                required
                disabled={loading}
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Biografia da Entidade
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm resize-none"
              disabled={loading}
              rows={3}
              placeholder="Fale um pouco sobre sua trajetória na rede..."
              maxLength={160}
            />
            <div className="flex justify-end text-[10px] text-slate-500 mt-1 uppercase font-medium tracking-wider">
              {formData.bio.length} / 160 Caracteres
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> Coordenadas / Localização
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                disabled={loading}
                placeholder="Cidade, Estado ou Planeta"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <Link2 className="w-3.5 h-3.5 text-purple-400" /> Link de Hipertexto
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                disabled={loading}
                placeholder="https://seusite.com"
              />
            </div>
          </div>

          {/* Ações de Envio */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 order-2 sm:order-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Atualizando Cadeia...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Sincronização</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 order-1 sm:order-2 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              <span>Abortar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}