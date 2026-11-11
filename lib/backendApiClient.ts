// lib/backendApiClient.ts
// Clientes HTTP do backend Python: um para o servidor (URL privada, token informado) e outro para
// o navegador (URL pública, token obtido pelo clientTokenManager).

import { clientTokenManager } from './clientBackendTokenManager';

const PRIVATE_BACKEND_API = process.env.BACKEND_URL || 'http://localhost:8000/';
const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';
// Opções aceitas pelo fetch
type FetchOptions = Parameters<typeof fetch>[1];

/**
 * Chamada ao backend a partir do servidor Next.js (BACKEND_URL) com o Bearer token informado.
 * Define Content-Type JSON, exceto para FormData.
 */
export async function backendApiServerCall(
  endpoint: string,
  options: FetchOptions = {},
  token: string,
) {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const mergedHeaders = {
    ...headers,
    ...((options.headers as Record<string, string>) || {}),
  };
  const response = await fetch(`${PRIVATE_BACKEND_API}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });

  return response;
}

/**
 * Chamada ao backend a partir do navegador (NEXT_PUBLIC_BACKEND_URL) com o JWT do
 * clientTokenManager. Define Content-Type JSON, exceto para FormData.
 */
export async function backendApiCall(endpoint: string, options: FetchOptions = {}) {
  const token = await clientTokenManager.getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const mergedHeaders = {
    ...headers,
    ...((options.headers as Record<string, string>) || {}),
  };
  const response = await fetch(`${BACKEND_API}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });

  return response;
}
