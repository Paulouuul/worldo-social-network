// components/ClientImage.tsx
// Imagem que usa <img> para GIFs e imagens animadas (preservando a animação) e next/image para as
// demais.
'use client';

import Image from 'next/image';

/** Propriedades da imagem; aceita as props do next/image. */
interface ClientImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  isAnimated?: boolean;
  [key: string]: any;
}

/**
 * Renderiza <img> para .gif ou arquivos com '-animated' no nome e next/image para o resto.
 * Imagens não são arrastáveis.
 */
export function ClientImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  unoptimized: forcedUnoptimized,
  objectFit = 'cover',
  isAnimated: forcedAnimated = false,
  ...props
}: ClientImageProps) {
  // GIF pela extensão; animada pelo sufixo "-animated" no nome do arquivo
  const lowerSrc = src.toLowerCase();
  const isGif = lowerSrc.endsWith('.gif');
  const isAnimated = forcedAnimated || lowerSrc.includes('-animated');

  // <img> preserva a animação de GIF/WebP animado
  if (isGif || isAnimated) {
    const imgStyle = fill
      ? {
          position: 'absolute' as React.CSSProperties['position'],
          width: '100%',
          height: '100%',
          objectFit: objectFit as React.CSSProperties['objectFit'],
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

  // Demais imagens usam o componente otimizado do Next.js
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      priority={priority}
      sizes={sizes}
      draggable={false}
      unoptimized={forcedUnoptimized}
      {...props}
    />
  );
}
