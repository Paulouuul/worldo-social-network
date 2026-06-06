// components/ClientImage.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ClientImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  [key: string]: any;
}

const mimeCache = new Map<string, string>();
const animatedCheckCache = new Map<string, boolean>();

// Verifica se é formato que pode ser animado
const isAnimatedFormat = async (src: string): Promise<boolean> => {
  // Verifica extensão do arquivo primeiro (mais rápido)
  const extension = src.split('.').pop()?.toLowerCase();
  if (extension === 'gif') {
    return true; // GIFs são sempre animados
  }
  
  // Para WebP, precisa verificar o conteúdo
  if (extension === 'webp') {
    if (animatedCheckCache.has(src)) {
      return animatedCheckCache.get(src)!;
    }
    
    try {
      const response = await fetch(src);
      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Verifica signature WebP (RIFF....WEBP)
      if (uint8Array.length > 20) {
        const isWebP = 
          uint8Array[0] === 0x52 && // R
          uint8Array[1] === 0x49 && // I
          uint8Array[2] === 0x46 && // F
          uint8Array[3] === 0x46 && // F
          uint8Array[8] === 0x57 && // W
          uint8Array[9] === 0x45 && // E
          uint8Array[10] === 0x42 && // B
          uint8Array[11] === 0x50;   // P
        
        if (isWebP) {
          // Procura pelo chunk ANIM (WebP animado)
          let hasAnim = false;
          let offset = 12; // Pula o cabeçalho inicial
          
          while (offset + 8 <= uint8Array.length) {
            const chunkId = String.fromCharCode(
              uint8Array[offset],
              uint8Array[offset + 1],
              uint8Array[offset + 2],
              uint8Array[offset + 3]
            );
            
            if (chunkId === 'ANIM') {
              hasAnim = true;
              break;
            }
            
            // Pula para o próximo chunk
            const chunkSize = uint8Array[offset + 4] |
                            (uint8Array[offset + 5] << 8) |
                            (uint8Array[offset + 6] << 16) |
                            (uint8Array[offset + 7] << 24);
            offset += 8 + chunkSize;
            
            if (chunkSize === 0) break;
          }
          
          animatedCheckCache.set(src, hasAnim);
          return hasAnim;
        }
      }
    } catch (error) {
      console.warn('Failed to detect WebP animation:', error);
    }
    
    animatedCheckCache.set(src, false);
    return false;
  }
  
  // Para outros formatos, verifica pelo MIME type
  if (mimeCache.has(src)) {
    const mime = mimeCache.get(src)!;
    return mime === 'image/gif' || mime === 'image/webp' || mime === 'image/avif';
  }
  
  try {
    const response = await fetch(src, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    if (contentType) {
      mimeCache.set(src, contentType);
      return contentType === 'image/gif' || 
             contentType === 'image/webp' || 
             contentType === 'image/avif';
    }
  } catch (error) {
    console.warn('Failed to detect MIME type:', error);
  }
  
  return false;
};

export function ClientImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  quality,
  sizes,
  ...props
}: ClientImageProps) {
  const [mounted, setMounted] = useState(false);
  const [needsUnoptimized, setNeedsUnoptimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Detecta se precisa de unoptimized
    const checkFormat = async () => {
      const isAnimated = await isAnimatedFormat(src);
      setNeedsUnoptimized(isAnimated);
      setIsLoading(false);
    };
    
    checkFormat();
  }, [src]);

  if (!mounted || isLoading) {
    // Placeholder durante o carregamento
    const placeholderStyle = fill 
      ? { position: 'relative' as const, width: '100%', height: '100%' }
      : { width, height };
    
    return (
      <div
        className={`${className} bg-gray-200 animate-pulse`}
        style={placeholderStyle}
        aria-label="Loading image"
      />
    );
  }

  // Para imagens animadas (GIF/WebP animado), usa unoptimized
  if (needsUnoptimized) {
    const imgStyle = fill 
      ? { 
          position: 'absolute' as const, 
          width: '100%', 
          height: '100%', 
        }
      : undefined;
    
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        style={imgStyle}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        loading={priority ? 'eager' : 'lazy'}
        draggable={false}
        {...props}
      />
    );
  }

  // Para imagens normais (estáticas), usa componente Image do Next.js
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes}
      draggable={false}
      suppressHydrationWarning
      {...props}
    />
  );
}