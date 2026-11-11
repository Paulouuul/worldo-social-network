// components/GlobalMediaProtector.tsx
// Proteção global de mídia: bloqueia menu de contexto e arraste em imagens/vídeos e desativa
// download e picture-in-picture de vídeos.
'use client';

import { useEffect } from 'react';

/**
 * Aplica a proteção de mídia no documento inteiro, inclusive em elementos adicionados depois
 * (MutationObserver).
 */
export function GlobalMediaProtector() {
  useEffect(() => {
    /** Bloqueia o menu de contexto (clique direito) sobre imagens e vídeos. */
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('video')
      ) {
        e.preventDefault();
        return false;
      }
    };

    /** Bloqueia o arraste de imagens. */
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault();
        return false;
      }
    };

    /**
     * Marca imagens como não arrastáveis e vídeos sem download/picture-in-picture (sem alterar
     * estilos).
     */
    const protectMedia = () => {
      // Imagens
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.hasAttribute('draggable')) {
          img.setAttribute('draggable', 'false');
        }
      });

      // Vídeos
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        if (!video.hasAttribute('controlslist')) {
          video.setAttribute('controlslist', 'nodownload');
        }
        if (!video.hasAttribute('disablepictureinpicture')) {
          video.setAttribute('disablepictureinpicture', 'true');
        }
      });
    };

    // Protege a mídia já presente
    protectMedia();

    // Protege mídias adicionadas depois
    const observer = new MutationObserver(() => {
      protectMedia();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      observer.disconnect();
    };
  }, []);

  return null;
}
