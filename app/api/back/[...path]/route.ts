// app/api/back/[...path]/route.ts
// Rota /api/back/*: proxy para o backend Python. Repassa método, query, corpo (JSON, multipart,
// urlencoded ou texto) e headers selecionados, autenticando com o Bearer recebido ou com o JWT
// gerado no servidor a partir da sessão.

import { NextRequest, NextResponse } from 'next/server';
import { backendApiServerCall } from '@/lib/api/backendApiClient';
import { serverTokenManager } from '@/lib/auth/backendToken/serverBackendTokenManager';

// Valores aceitos em cache do fetch
type CacheType = 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
// Valores aceitos em credentials do fetch
type CredentialsType = 'include' | 'omit' | 'same-origin';
// Valores aceitos em mode do fetch
type ModeType = 'cors' | 'no-cors' | 'same-origin' | 'navigate';
// Opções do fetch
type FetchOptions = Parameters<typeof fetch>[1];

// Headers repassados na resposta
type ResponseHeaders = Record<string, string>;

// Lista de nomes de headers repassados
type ForwardHeaders = readonly string[];

// Headers da requisição repassados ao backend
const FORWARD_HEADERS: ForwardHeaders = [
  'x-user-id',
  'x-tenant-id',
  'x-request-id',
  'x-api-key',
  'x-session-id',
  'user-agent',
  'accept',
  'accept-language',
  'accept-encoding',
  'cache-control',
  'pragma',
  'expires',
] as const;

// Headers da resposta do backend repassados ao cliente
const FORWARD_RESPONSE_HEADERS: ForwardHeaders = [
  'cache-control',
  'etag',
  'last-modified',
  'expires',
  'x-request-id',
  'x-rate-limit-limit',
  'x-rate-limit-remaining',
  'x-rate-limit-reset',
] as const;

// Métodos HTTP que podem ter body
const METHODS_WITH_BODY: readonly string[] = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * Encaminha a requisição para `<BACKEND_URL>/<path>` e devolve status, corpo e headers relevantes da
 * resposta. Retorna 504 em timeout e 500 em outros erros.
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params;
    const authHeader = request.headers.get('authorization');
    var token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      token = await serverTokenManager.getToken();
    }

    const pathArray: string[] = resolvedParams.path || [];
    const path: string = pathArray.join('/');

    const method: string = request.method;

    // Caminho + query string originais
    const searchParams: URLSearchParams = request.nextUrl.searchParams;
    const queryString: string = searchParams.toString();
    const endpoint: string = queryString ? `${path}?${queryString}` : path;

    const requestHeaders: Record<string, string> = {};
    const options: FetchOptions = {
      method,
      headers: requestHeaders,
    };

    if (METHODS_WITH_BODY.includes(method)) {
      const incomingContentType: string = request.headers.get('content-type') || '';

      if (incomingContentType.includes('application/json')) {
        try {
          const body: unknown = await request.json();
          options.body = JSON.stringify(body);
          requestHeaders['Content-Type'] = 'application/json';
        } catch {}
      } else if (incomingContentType.includes('multipart/form-data')) {
        const formData: FormData = await request.formData();
        options.body = formData;
        // Content-Type (com boundary) é definido pelo fetch
      } else if (incomingContentType.includes('application/x-www-form-urlencoded')) {
        const body: string = await request.text();
        options.body = body;
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (incomingContentType) {
        const body: string = await request.text();
        if (body) {
          options.body = body;
          requestHeaders['Content-Type'] = incomingContentType;
        }
      } else {
        const body: string = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }

    for (const header of FORWARD_HEADERS) {
      const value: string | null = request.headers.get(header);
      if (value) {
        requestHeaders[header] = value;
      }
    }

    // Cache, credentials e mode vindos dos headers, quando válidos
    if (method === 'GET') {
      const cacheControl: string | null = request.headers.get('cache-control');
      if (cacheControl && isValidCacheType(cacheControl)) {
        options.cache = cacheControl as CacheType;
      }
    }

    const credentials: string | null = request.headers.get('credentials');
    if (credentials && isValidCredentialsType(credentials)) {
      options.credentials = credentials as CredentialsType;
    }

    const mode: string | null = request.headers.get('mode');
    if (mode && isValidModeType(mode)) {
      options.mode = mode as ModeType;
    }

    const response: Response = await backendApiServerCall(endpoint, options, token);

    // Corpo repassado como texto (JSON, texto ou vazio)
    const responseData: string = await response.text();
    const responseContentType: string = response.headers.get('content-type') || 'application/json';

    const responseHeaders: ResponseHeaders = {
      'Content-Type': responseContentType,
    };

    for (const header of FORWARD_RESPONSE_HEADERS) {
      const value: string | null = response.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
      }
    }

    return new NextResponse(responseData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('API Proxy Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Gateway Timeout',
          message: 'O servidor demorou muito para responder',
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/** Indica se o valor é um modo de cache aceito pelo fetch. */
function isValidCacheType(value: string): value is CacheType {
  const validValues: CacheType[] = [
    'default',
    'force-cache',
    'no-cache',
    'no-store',
    'only-if-cached',
    'reload',
  ];
  return validValues.includes(value as CacheType);
}

/** Indica se o valor é um modo de credentials aceito pelo fetch. */
function isValidCredentialsType(value: string): value is CredentialsType {
  const validValues: CredentialsType[] = ['include', 'omit', 'same-origin'];
  return validValues.includes(value as CredentialsType);
}

/** Indica se o valor é um modo (mode) aceito pelo fetch. */
function isValidModeType(value: string): value is ModeType {
  const validValues: ModeType[] = ['cors', 'no-cors', 'same-origin', 'navigate'];
  return validValues.includes(value as ModeType);
}

/** Mesmo handler para todos os métodos HTTP. */
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
