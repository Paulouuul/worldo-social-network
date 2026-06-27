import { clientTokenManager } from './clientBackendTokenManager';

const PRIVATE_BACKEND_API = process.env.BACKEND_URL || 'http://localhost:8000/';
const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';
type FetchOptions = Parameters<typeof fetch>[1];

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
