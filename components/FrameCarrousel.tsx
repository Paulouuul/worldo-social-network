'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AvatarWithFrame } from './AvatarWithFrame'

export function FrameCarousel({ avatarUrl, frameUrl, rarity, thumbnailUrl, className }: any) {
  const [showThumbnail, setShowThumbnail] = useState(false)

  // Decide qual URL exibir: a moldura principal ou a thumbnail especial
  const displayUrl = showThumbnail ? thumbnailUrl : frameUrl
  const hasThumbnail = thumbnailUrl && thumbnailUrl !== frameUrl

  return (
    <div className={`relative group ${className}`}>
      {/* Container do Avatar/Moldura */}
      <AvatarWithFrame 
        avatarUrl={avatarUrl}
        frameUrl={displayUrl}
        rarity={rarity}
        size="full"
        className="w-full h-full"
      />

      {/* Setas de navegação (aparecem ao passar o mouse ou no toque) */}
      {hasThumbnail && (
        <>
          <button 
            onClick={() => setShowThumbnail(!showThumbnail)}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setShowThumbnail(!showThumbnail)}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
          
          {/* Indicadores (pontinhos) */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
            <div className={`h-1.5 w-1.5 rounded-full transition-colors ${!showThumbnail ? 'bg-blue-500' : 'bg-slate-600'}`} />
            <div className={`h-1.5 w-1.5 rounded-full transition-colors ${showThumbnail ? 'bg-blue-500' : 'bg-slate-600'}`} />
          </div>
        </>
      )}
    </div>
  )
}