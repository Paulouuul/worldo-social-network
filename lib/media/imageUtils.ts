// lib/media/imageUtils.ts
// Conversão de imagens para WebP com sharp (estático ou animado a partir de GIF).

import sharp from 'sharp';

/**
 * Opções de conversão: formato, qualidade (1–100), dimensões máximas, transparência e modo de
 * ajuste.
 */
export interface ConvertOptions {
  format: 'webp' | 'webp-animated';
  quality: number; // 1-100 (recomendado: 70-85)
  width?: number; // Largura máxima (opcional)
  height?: number; // Altura máxima (opcional)
  preserveTransparency?: boolean; // Para PNGs
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/** Resultado da conversão: buffer WebP, tamanhos, redução percentual, se é animado e metadados. */
export interface ConvertResult {
  buffer: Buffer;
  format: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: string;
  isAnimated: boolean;
  metadata?: {
    width?: number;
    height?: number;
    frames?: number; // Para GIFs animados
  };
}

/** Acrescenta '-animated' antes da extensão quando a origem é GIF. */
export function addAnimatedSuffix(filename: string, isGif: boolean): string {
  if (!isGif) return filename;

  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return `${filename}-animated`;

  const name = filename.substring(0, lastDotIndex);
  const extension = filename.substring(lastDotIndex);

  return `${name}-animated${extension}`;
}

/** Trata image/jfif como image/jpeg. */
function normalizeMimeType(mimeType: string): string {
  if (mimeType === 'image/jfif') {
    return 'image/jpeg';
  }
  return mimeType;
}

/**
 * Converte a imagem para WebP, redimensionando sem ampliar.
 *
 * GIF gera WebP animado em loop mantendo os delays; PNG usa near-lossless com qualidade ≥ 80.
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  originalType: string,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const normalizedType = normalizeMimeType(originalType);
  const isGif = normalizedType === 'image/gif';
  const isAnimated = options.format === 'webp-animated' || isGif;
  const quality = Math.min(100, Math.max(1, options.quality));

  let metadata: any = {};
  try {
    metadata = await sharp(inputBuffer, { animated: isGif }).metadata();
  } catch (err) {
    console.error('Erro ao ler metadados:', err);
  }

  let pipeline = sharp(inputBuffer, {
    animated: isAnimated,
    limitInputPixels: false, // Sem limite de pixels de entrada
  });

  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  let webpOptions: any = {
    quality: quality,
    effort: 6, // Esforço máximo de compressão
    smartSubsample: true,
  };

  // GIF animado: loop infinito e delays originais
  if (isGif && isAnimated) {
    webpOptions = {
      ...webpOptions,
      loop: 0,
      delay: metadata.delay || [100],
      force: true,
    };
  }

  // PNG com transparência: near-lossless em qualidade alta
  if (originalType === 'image/png' && options.preserveTransparency !== false) {
    webpOptions.nearLossless = quality >= 80;
  }

  const optimizedBuffer = await pipeline.webp(webpOptions).toBuffer();

  const originalSize = inputBuffer.length;
  const optimizedSize = optimizedBuffer.length;
  const reductionPercent = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

  return {
    buffer: optimizedBuffer,
    format: 'webp',
    originalSize,
    optimizedSize,
    reductionPercent: `${reductionPercent}%`,
    isAnimated: isAnimated && !!(metadata.pages && metadata.pages > 1),
    metadata: {
      width: metadata.width,
      height: metadata.height,
      frames: metadata.pages,
    },
  };
}
