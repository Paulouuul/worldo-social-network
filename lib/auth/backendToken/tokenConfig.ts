// lib/auth/backendToken/tokenConfig.ts
// Validade do JWT do backend Python, compartilhada pelo gerador e pelos gerenciadores de cache.

/**
 * Validade em minutos, lida de BACKEND_TOKEN_EXPIRATION (aceita "15" ou "15m"; padrão 15).
 * No navegador a variável não é exposta e vale o padrão.
 */
export const BACKEND_TOKEN_EXPIRY_MINUTES =
  parseInt(process.env.BACKEND_TOKEN_EXPIRATION ?? '', 10) || 15;

/** Validade em milissegundos. */
export const BACKEND_TOKEN_EXPIRY_MS = BACKEND_TOKEN_EXPIRY_MINUTES * 60 * 1000;

/** Antecedência com que o token em cache é renovado antes de expirar. */
export const BACKEND_TOKEN_RENEW_MARGIN_MS = 2 * 60 * 1000;
