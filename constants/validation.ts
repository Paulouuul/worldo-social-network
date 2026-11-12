// constants/validation.ts
// Limites de validação de texto usados no frontend e nas rotas de API do Next.js. Os mesmos
// valores são validados pelo backend Python (UpdateProfileUseCase e CreateCosmeticFrameUseCase);
// ao alterar aqui, alterar também lá.

/** Nome de exibição do usuário. */
export const NAME_LENGTH = { min: 3, max: 50 };

/** Nome de usuário (letras, números e underscore). */
export const USERNAME_LENGTH = { min: 3, max: 30 };

/** Tamanho mínimo da senha (além de maiúscula, minúscula, número e caractere especial). */
export const PASSWORD_MIN_LENGTH = 6;

/** Campos do perfil. */
export const PROFILE_LIMITS = { bio: 500, location: 30, website: 200 };

/** Nome e descrição de moldura cosmética. */
export const FRAME_NAME_LENGTH = { min: 3, max: 50 };
export const FRAME_DESCRIPTION_MAX_LENGTH = 500;
