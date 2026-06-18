// lib/pythonApiClient.ts
import { tokenManager } from './pythonTokenManager';

const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_URL || 'http://localhost:8000';
type FetchOptions = Parameters<typeof fetch>[1];

export async function pythonApiCall(
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
  
  const response = await fetch(`${PYTHON_API}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });
  
  return response;
}