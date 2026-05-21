'use client'
import { useRef } from 'react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, redirect } from 'next/navigation'
import Image from 'next/image'

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
  // Estado para controle do upload
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
          setAvatarPreview(data.avatar || session.user.avatar || 'None')
        })
    }
  }, [session])

  if (!session?.user) {
    redirect('/login/')
    return null
  }

  // Handle file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, GIF ou WEBP.')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      return
    }

    setAvatarFile(file)
    setRemoveAvatar(false)
    // Criar preview local
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setError('')
  }

  // Handle remove avatar
  const handleRemoveAvatar = () => {
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
      submitData.append('username', formData.username)
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
        body: submitData,  // Não colocar headers Content-Type
      })

      const data = await res.json()
      console.log('Dados retornados da API:', data)  // ← ADICIONAR

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar perfil')
        window.scrollTo({ top: 0 })
      } else {
        setSuccess('Perfil atualizado com sucesso!')
        window.scrollTo({ top: 0 })
        
        // Atualizar sessão com novos dados
        await update({
          ...session,
          user: { 
            ...session.user, 
            ...data.user,
            avatar: data.user.avatar || "None", 
          }
        })
        
        // Limpar estados do upload
        setAvatarFile(null)
        setRemoveAvatar(false)
        
        setTimeout(() => setSuccess(''), 1500)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
      // Voltar para o perfil com refresh
      router.push(`/perfil/${session.user?.id}`)
      router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card-highlight p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Editar Perfil</h1>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/30">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-400 p-3 rounded mb-4 text-sm border border-green-500/30">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block mb-2">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {/* Preview do avatar */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-700">
                {avatarPreview && avatarPreview !== "None" ? (
                  <Image
                    src={avatarPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-purple-600">
                    {formData.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="avatar-upload"
                  className="btn-secondary cursor-pointer inline-block text-center"
                >
                  Escolher arquivo
                </label>
                
                {(avatarPreview || formData.avatar) && !removeAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="ml-2 text-red-400 hover:text-red-300 text-sm"
                    disabled={loading}
                  >
                    Remover
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF ou WEBP. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2">Nome de usuário</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="input"
              required
              disabled={loading}
              placeholder="usuario_123"
            />
            <p className="text-xs text-gray-500 mt-1">Apenas letras, números e underline. 3-30 caracteres.</p>
          </div>

          <div>
            <label className="block mb-2">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              disabled={loading}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input"
              disabled={loading}
              rows={4}
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          <div>
            <label className="block mb-2">Localização</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              disabled={loading}
              placeholder="Cidade, Estado"
            />
          </div>

          <div>
            <label className="block mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="input"
              disabled={loading}
              placeholder="https://seusite.com"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}