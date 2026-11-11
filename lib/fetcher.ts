// lib/fetcher.ts
// Funções de busca usadas pelas queries do React Query. Lançam HttpError quando a resposta não é
// ok, para que o React Query trate como erro.

import { backendApiCall } from '@/lib/backendApiClient';

// Opções aceitas pelo fetch
type FetchOptions = Parameters<typeof fetch>[1];

/** Erro HTTP com status e corpo da resposta; a mensagem vem de `error` ou `detail` do corpo. */
export class HttpError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.error || data?.detail || `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

/** Lê o JSON da resposta e lança HttpError se o status não for 2xx. */
async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new HttpError(res.status, data);
  return data as T;
}

/** GET/POST nas rotas do Next.js (/api/...) retornando o JSON tipado. */
export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  return parse<T>(await fetch(url, options));
}

/** Chamada ao backend Python (com o JWT do backend) retornando o JSON tipado. */
export async function backendJson<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  return parse<T>(await backendApiCall(endpoint, options));
}

/** Monta a query string (com '?') ignorando valores vazios, nulos e 'all'. */
export function toQueryString(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
