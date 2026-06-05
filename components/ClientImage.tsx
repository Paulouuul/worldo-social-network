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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // NÃO passe as props para o div - use apenas className e style
    return (
      <div
        className={className}
        style={fill ? { position: 'relative', width: '100%', height: '100%' } : undefined}
      />
    );
  }

  // Só depois da hidratação, renderiza o Image com todas as props
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
