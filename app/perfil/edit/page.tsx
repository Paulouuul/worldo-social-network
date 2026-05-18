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
  const hasFetched = useRef(false)
  useEffect(() => {
  if (session?.user?.id && !hasFetched.current) {
    hasFetched.current = true

    setFormData({
      name: session.user.name || '',  // ← da sessão (rápido)
      username: session.user.username || '',
      avatar: session.user.image || '', // ← da sessão
      bio: '',  // será preenchido pelo banco
      location: '',
      website: '',
    })
    
    // Busca dados complementares no banco
    fetch(`/api/user/${session.user.id}`)
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          username: data.username || prev.username,
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
        }))
      })
  }
}, [session])

  // if (status === 'loading') {
  //   return <div className="text-center py-12">Carregando...</div>
  // }

  if (!session?.user) {
    redirect('/login/');
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao atualizar perfil')
      } else {
        setSuccess('Perfil atualizado com sucesso!')
        await update({
          ...session,
          user: { ...session.user, ...formData,}
        })
        setTimeout(() => router.push(`/perfil/${session.user?.id}`), 1500)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
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
          <div>
            <label className="block mb-2">Nome de usuário</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="input"
              required
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
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input"
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
              placeholder="https://seusite.com"
            />
          </div>

          <div>
            <label className="block mb-2">Foto de perfil (URL)</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="input"
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
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