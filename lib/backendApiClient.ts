// lib/backendApiClient.ts
import { tokenManager } from './backendTokenManager';

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/';
type FetchOptions = Parameters<typeof fetch>[1];

export async function backendApiCall(
  endpoint: string, 
  options: FetchOptions = {}
) {
  const token = await tokenManager.getToken();
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const mergedHeaders = {
    ...headers,
    ...(options.headers as Record<string, string> || {}),
  };
  console.log(`chamei backend api client ${BACKEND_API}${endpoint}`)
  const response = await fetch(`${BACKEND_API}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });
  
  return response;
}