// lib/image-converter.ts
import sharp from 'sharp';

export interface ConvertOptions {
  format: 'webp' | 'webp-animated';
  quality: number; // 1-100 (recomendado: 70-85)
  width?: number; // Largura máxima (opcional)
  height?: number; // Altura máxima (opcional)
  preserveTransparency?: boolean; // Para PNGs
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

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

export function addAnimatedSuffix(filename: string, isGif: boolean): string {
  if (!isGif) return filename;

  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return `${filename}-animated`;

  const name = filename.substring(0, lastDotIndex);
  const extension = filename.substring(lastDotIndex);

  return `${name}-animated${extension}`;
}

function normalizeMimeType(mimeType: string): string {
  // JFIF é essencialmente JPEG
  if (mimeType === 'image/jfif') {
    return 'image/jpeg';
  }
  return mimeType;
}

/**
 * Converte imagem para WebP (estático ou animado)
 * @param inputBuffer - Buffer da imagem original
 * @param originalType - Tipo original (image/gif, image/png, etc)
 * @param options - Opções de conversão
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

  // Obter metadados originais
  let metadata: any = {};
  try {
    metadata = await sharp(inputBuffer, { animated: isGif }).metadata();
  } catch (err) {
    console.error('Erro ao ler metadados:', err);
  }

  let pipeline = sharp(inputBuffer, {
    animated: isAnimated,
    limitInputPixels: false, // Previne erro de imagem muito grande
  });

  // Redimensionar se necessário
  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: options.fit || 'inside',
      withoutEnlargement: true, // Não aumenta imagens menores
    });
  }

  // Configurações específicas por tipo
  let webpOptions: any = {
    quality: quality,
    effort: 6, // Máximo esforço de compressão (0-6)
    smartSubsample: true,
  };

  // Configurações para GIF animado
  if (isGif && isAnimated) {
    webpOptions = {
      ...webpOptions,
      loop: 0, // Loop infinito
      delay: metadata.delay || [100], // Mantém timing original
      force: true,
    };
  }

  // Configurações para PNG com transparência
  if (originalType === 'image/png' && options.preserveTransparency !== false) {
    webpOptions.nearLossless = quality >= 80;
  }

  // Executar conversão
  const optimizedBuffer = await pipeline.webp(webpOptions).toBuffer();

  // Calcular redução
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
