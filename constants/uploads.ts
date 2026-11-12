// constants/uploads.ts
// Regras de upload de imagens validadas no navegador antes do envio. Os mesmos limites são
// validados pelo backend Python (UpdateProfileUseCase e CreateCosmeticFrameUseCase); ao alterar
// aqui, alterar também lá.

/** Tipos de imagem aceitos nos uploads. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/jfif'];

/** Valor do atributo accept dos inputs de arquivo. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

/** Limite de tamanho em MB: geral e para GIF. */
export interface UploadLimit {
  max: number;
  gif: number;
}

/** Limites por tipo de upload. */
export const UPLOAD_LIMITS_MB = {
  avatar: { max: 5, gif: 3 },
  cover: { max: 8, gif: 5 },
  frame: { max: 5, gif: 3 },
  thumbnail: { max: 2, gif: 1 },
} satisfies Record<string, UploadLimit>;

/** Converte megabytes em bytes. */
export const mbToBytes = (mb: number) => mb * 1024 * 1024;

/** Texto exibido abaixo do campo de upload (ex.: "Máximo: 5MB (GIFs: 3MB)."). */
export const uploadLimitText = (limit: UploadLimit) =>
  `Máximo: ${limit.max}MB (GIFs: ${limit.gif}MB).`;
