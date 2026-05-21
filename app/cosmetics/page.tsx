'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface MarketplaceListing {
  id: string
  frameId: string
  quantity: number
  priceCoins: number
  frame: {
    id: string
    name: string
    description: string
    imageUrl: string
    thumbnailUrl: string
    rarity: string
    creator: { name: string; username: string }
  }
  seller: { name: string; username: string }
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cosmetics/marketplace')
      .then(res => res.json())
      .then(data => {
        setListings(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erro ao carregar marketplace:', err)
        setLoading(false)
      })
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-green-400'
      case 'RARO': return 'text-blue-400'
      case 'EPICO': return 'text-purple-400'
      case 'LENDARIO': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Carregando marketplace...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🎨 Marketplace de Molduras</h1>

      {listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma moldura disponível no momento.</p>
          <Link href="/cosmetics/create" className="btn-primary inline-block mt-4">
            Criar minha primeira moldura
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="card-highlight rounded-xl overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={item.frame.thumbnailUrl || item.frame.imageUrl}
                  alt={item.frame.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold">{item.frame.name}</h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.frame.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className={`text-sm font-semibold ${getRarityColor(item.frame.rarity)}`}>
                    {item.frame.rarity}
                  </span>
                  <span className="text-purple-400 font-bold">{item.priceCoins} 🪙</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">por {item.seller.name}</p>
                <p className="text-xs text-gray-500">📦 {item.quantity} disponível</p>
                <Link
                  href={`/cosmeticos/${item.frameId}`}
                  className="btn-primary w-full mt-4 text-center block"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}