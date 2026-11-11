// lib/fetcher.ts
// Funções de busca usadas pelas queries do React Query.
// Lançam HttpError quando a resposta não é ok, para que o React Query trate como erro.
import { backendApiCall } from '@/lib/backendApiClient';

type FetchOptions = Parameters<typeof fetch>[1];

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

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new HttpError(res.status, data);
  return data as T;
}

/** Chamada às rotas do Next.js (/api/worldo/...). */
export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  return parse<T>(await fetch(url, options));
}

/** Chamada ao backend Python (com token JWT do backend). */
export async function backendJson<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  return parse<T>(await backendApiCall(endpoint, options));
}

/** Monta query string ignorando valores vazios e 'all'. */
export function toQueryString(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
