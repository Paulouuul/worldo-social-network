'use client'

import { useRef, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClientImage } from '@/components/ClientImage' 
import { Sparkles, User, AtSign, FileText, MapPin, Link2, Upload, Trash2, Save, X, Image as ImageIcon } from 'lucide-react'

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
    coverImage: '',
  })
  
  // Estados para o Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Estados para o Cover
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [removeCover, setRemoveCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const hasLoaded = useRef(false)
  
  useEffect(() => {
  if (session?.user && !hasLoaded.current) {
    hasLoaded.current = true
    setFormData({
      name: session.user.name || '',
      username: session.user.username || '',
      bio: session.user.bio || '',
      location: session.user.location || '',
      website: session.user.website || '',
      avatar: session.user.avatar || '',
      coverImage: session.user.coverImage || '',
    })
    setAvatarPreview(session.user.avatar || '')
    setCoverPreview(session.user.coverImage || '')
  }
}, [session])

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 mt-4 text-purple-300 font-medium text-sm">Sincronizando terminal...</span>
      </div>
    )
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'cover'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError(`Formato de ${type} não suportado. Use JPG, PNG, GIF ou WEBP.`)
      return
    }

    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`Arquivo de ${type} muito grande. Máximo ${maxSize / 1024 / 1024}MB.`)
      return
    }

    if (type === 'avatar') {
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      setAvatarFile(file)
      setRemoveAvatar(false)
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
      setCoverFile(file)
      setRemoveCover(false)
      setCoverPreview(URL.createObjectURL(file))
    }
    setError('')
  }

  const handleRemoveAvatar = () => {
    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setRemoveAvatar(true)
    setAvatarPreview('')
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleRemoveCover = () => {
    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setRemoveCover(true)
    setCoverPreview('')
    if (coverInputRef.current) coverInputRef.current.value = ''
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
      
      if (avatarFile) submitData.append('avatar', avatarFile)
      if (removeAvatar) submitData.append('removeAvatar', 'true')
      
      if (coverFile) submitData.append('cover', coverFile)
      if (removeCover) submitData.append('removeCover', 'true')

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        body: submitData, 
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar perfil')
        window.scrollTo({ top: 0, behavior: 'smooth' })

        // REVERSÃO NA UI: Como a API deu erro e descartou o upload (ou não removeu), 
        // voltamos os previews para o que está salvo atualmente no formData original estável.
        if (avatarFile || removeAvatar) {
          if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
          setAvatarFile(null)
          setRemoveAvatar(false)
          setAvatarPreview(formData.avatar || '')
          if (avatarInputRef.current) avatarInputRef.current.value = ''
        }

        if (coverFile || removeCover) {
          if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
          setCoverFile(null)
          setRemoveCover(false)
          setCoverPreview(formData.coverImage || '')
          if (coverInputRef.current) coverInputRef.current.value = ''
        }

      } else {
        setSuccess('Perfil atualizado com sucesso!')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        const updatedUser = {
          name: data.user?.name ?? formData.name,
          username: data.user?.username ?? formData.username,
          bio: data.user?.bio ?? '',
          location: data.user?.location ?? '',
          website: data.user?.website ?? '',
          avatar: data.user?.avatar ?? formData.avatar,
          coverImage: data.user?.coverImage ?? formData.coverImage,
        }
        // Atualiza a colagem estável do formData local com os novos dados validados vindos da API
        setFormData(updatedUser)

        await update({
          user: updatedUser
        })
        
        setAvatarFile(null)
        setRemoveAvatar(false)
        setCoverFile(null)
        setRemoveCover(false)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      // Em caso de queda total de rede, também resetamos para o estado estável anterior
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
      setAvatarFile(null)
      setCoverFile(null)
      setRemoveAvatar(false)
      setRemoveCover(false)
      setAvatarPreview(formData.avatar || '')
      setCoverPreview(formData.coverImage || '')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/worldo/perfil/${session.user?.publicId}`)
  }
  
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden flex items-center justify-center">
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
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-xs border border-red-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-6 text-xs border border-emerald-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SEÇÃO: Imagem de Capa (Cover) */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <label className="flex items-center gap-1.5 text-slate-300 mb-3 font-semibold text-xs tracking-wide uppercase">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Capa do Perfil / Banner
            </label>
            
            <div className="space-y-4">
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group shadow-inner">
                {coverPreview && coverPreview !== "None" ? (
                  <ClientImage
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">Sem imagem de capa</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleFileChange(e, 'cover')}
                    className="hidden"
                    id="cover-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" /> Transmitir Capa
                  </label>

                  {coverPreview && coverPreview !== "None" && !removeCover && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                      disabled={loading}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Máximo: 10MB</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Avatar de Rede */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <label className="flex items-center gap-1.5 text-slate-300 mb-3 font-semibold text-xs tracking-wide uppercase">
              Avatar de Rede
            </label>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 bg-slate-950 shrink-0 shadow-inner">
                {avatarPreview && avatarPreview !== "None" ? (
                  <ClientImage
                    src={avatarPreview}
                    alt="Avatar Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-white font-black">
                    ?
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleFileChange(e, 'avatar')}
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
                  Máximo permitido: 5MB.
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

          {/* Biografia */}
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

          {/* Localização e Website */}
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
              <span>Finalizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}