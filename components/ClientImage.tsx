// components/ClientImage.tsx
'use client';

import Image from 'next/image';

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
  [key: string]: any;
}

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
  ...props
}: ClientImageProps) {
  // Verifica a extensão e se o sufixo "animated" está no nome do arquivo
  const lowerSrc = src.toLowerCase();
  const isGif = lowerSrc.endsWith('.gif');
  const isAnimated = lowerSrc.includes('-animated');

  // Utiliza a tag <img> padrão para GIFs e imagens animadas
  if (isGif || isAnimated) {
    const imgStyle = fill
      ? {
          position: 'absolute' as React.CSSProperties['position'],
          width: '100%',
          height: '100%',
          objectFit: 'cover' as React.CSSProperties['objectFit'],
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

  // Caso contrário, usa o componente otimizado do Next.js
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
