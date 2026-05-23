// components/GlobalMediaProtector.tsx
'use client'

import { useEffect } from 'react'

export function GlobalMediaProtector() {
  useEffect(() => {
    // 1. Impede clique direito em imagens/vídeos
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' || 
          target.tagName === 'VIDEO' ||
          target.closest('img') ||
          target.closest('video')) {
        e.preventDefault()
        return false
      }
    }

    // 2. Impede arrastar imagens
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault()
        return false
      }
    }

    // 3. Adiciona atributos de proteção (sem modificar style)
    const protectMedia = () => {
      // Imagens
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        if (!img.hasAttribute('draggable')) {
          img.setAttribute('draggable', 'false')
        }
      })

      // Vídeos
      const videos = document.querySelectorAll('video')
      videos.forEach(video => {
        if (!video.hasAttribute('controlslist')) {
          video.setAttribute('controlslist', 'nodownload')
        }
        if (!video.hasAttribute('disablepictureinpicture')) {
          video.setAttribute('disablepictureinpicture', 'true')
        }
      })
    }

    // Aplica proteção inicial
    protectMedia()

    // Observer para novos elementos
    const observer = new MutationObserver(() => {
      protectMedia()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Adiciona event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
      observer.disconnect()
    }
  }, [])

  return null
}