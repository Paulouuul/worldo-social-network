'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function CreateCosmeticPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    category: 'PROFILE_PICTURE',
    rarity: 'COMUM',
    stock: 1,
    // priceCoins: 100, ← REMOVIDO (não é mais usado aqui)
  })

  if (status === 'loading') {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/cosmeticos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar moldura')
      } else {
        setSuccess('Moldura criada com sucesso! Agora você pode anunciá-la no marketplace.')
        setTimeout(() => router.push('/cosmeticos/meus'), 2000)
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Card principal */}
      <div className="card-highlight rounded-xl overflow-hidden">
        {/* Header com gradiente */}
        <div className="relative h-32 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white">✨ Criar Nova Moldura ✨</h1>
        </div>

        {/* Form Content */}
        <div className="p-6">
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
            {/* Nome */}
            <div>
              <label className="block mb-2 font-medium">Nome da Moldura</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
                placeholder="Ex: Moldura Dourada"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block mb-2 font-medium">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Descreva sua moldura..."
              />
            </div>
            {/* Raridade */}
            <div>
              <label className="block mb-2 font-medium">Raridade</label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                className="input"
              >
                <option value="COMUM">🟢 Comum</option>
                <option value="RARO">🔵 Raro</option>
                <option value="EPICO">🟣 Épico</option>
                <option value="LENDARIO">🟠 Lendário</option>
              </select>
            </div>

            {/* Estoque */}
            <div>
              <label className="block mb-2 font-medium">Quantidade (Estoque)</label>
              <input
                type="number"
                min="1"
                max="999"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 1 })}
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Quantas unidades você quer criar?</p>
            </div>

            {/* URL da Imagem */}
            <div>
              <label className="block mb-2 font-medium">URL da Imagem</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input"
                required
                placeholder="https://exemplo.com/imagem.png"
              />
            </div>

            {/* URL da Miniatura */}
            <div>
              <label className="block mb-2 font-medium">URL da Miniatura (opcional)</label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="input"
                placeholder="Deixe em branco para usar a mesma imagem"
              />
            </div>

            {/* Preview da Imagem */}
            {formData.imageUrl && (
              <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <div className="relative w-32 h-32 mx-auto">
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Custo estimado */}
            <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-300">
                💰 Custo de criação: <strong className="text-purple-400">50 moedas</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ao criar uma moldura, você gasta moedas. O valor é fixo por raridade.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Criando...' : '✨ Criar Moldura'}
              </button>
              <Link href="/cosmeticos" className="btn-secondary flex-1 text-center">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}