// app/api/back/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { backendApiDirectCall } from '@/lib/backendApiClient';
import { auth } from '@/auth';
import { generateJwtToken } from '@/lib/backend-jwt-token-generator';

// Tipos para evitar erros
type CacheType = 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
type CredentialsType = 'include' | 'omit' | 'same-origin';
type ModeType = 'cors' | 'no-cors' | 'same-origin' | 'navigate';
type FetchOptions = Parameters<typeof fetch>[1];

// Tipo para os headers da resposta
type ResponseHeaders = Record<string, string>;

// Tipo para os headers que serão forwardados
type ForwardHeaders = readonly string[];

// Constante com os headers a serem forwardados
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

// Constante com os headers da resposta a serem forwardados
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

// No Next.js 15+, 'params' é uma Promise.
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
): Promise<NextResponse> {
  try {

    const session = await auth();
    
        if (!session?.user) {
          return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

    const resolvedParams = await context.params;
    const authHeader = request.headers.get('authorization');
    var token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      token = await generateJwtToken(session);
    }
    

    const pathArray: string[] = resolvedParams.path || [];
    const path: string = pathArray.join('/');
    
    const method: string = request.method;

    // Construir URL completa com query params
    const searchParams: URLSearchParams = request.nextUrl.searchParams;
    const queryString: string = searchParams.toString();
    const endpoint: string = queryString ? `${path}?${queryString}` : path;

    // Preparar opções da requisição inicializando os Headers como objeto limpo
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
        } catch {

        }
      }

      else if (incomingContentType.includes('multipart/form-data')) {
        const formData: FormData = await request.formData();
        options.body = formData;
        // Não definir Content-Type manual aqui, o fetch nativo gerará o boundary correto
      }

      else if (incomingContentType.includes('application/x-www-form-urlencoded')) {
        const body: string = await request.text();
        options.body = body;
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      else if (incomingContentType) {
        const body: string = await request.text();
        if (body) {
          options.body = body;
          requestHeaders['Content-Type'] = incomingContentType;
        }
      }

      else {
        const body: string = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }

    // Forward de cabeçalhos úteis do sistema
  
    for (const header of FORWARD_HEADERS) {
      const value: string | null = request.headers.get(header);
      if (value) {
        requestHeaders[header] = value;
      }
    }

    // Suporte para cache (GET)
    if (method === 'GET') {
      const cacheControl: string | null = request.headers.get('cache-control');
      if (cacheControl && isValidCacheType(cacheControl)) {
        options.cache = cacheControl as CacheType;
      }
    }

    // Credentials
    const credentials: string | null = request.headers.get('credentials');
    if (credentials && isValidCredentialsType(credentials)) {
      options.credentials = credentials as CredentialsType;
    }

    // Mode
    const mode: string | null = request.headers.get('mode');
    if (mode && isValidModeType(mode)) {
      options.mode = mode as ModeType;
    }

    // Fazer a chamada para o backend através do SEU cliente estruturado
    const response: Response = await backendApiDirectCall(endpoint, token, options);

    // Processar resposta bruta (suporta JSON, Textos planos ou Binários vazios)
    const responseData: string = await response.text();
    const responseContentType: string = response.headers.get('content-type') || 'application/json';

    // Preservar headers importantes da resposta do Python
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

    // Tratamento específico para timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Gateway Timeout',
          message: 'O servidor demorou muito para responder',
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Funções helper para validação de tipos
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

function isValidCredentialsType(value: string): value is CredentialsType {
  const validValues: CredentialsType[] = ['include', 'omit', 'same-origin'];
  return validValues.includes(value as CredentialsType);
}

function isValidModeType(value: string): value is ModeType {
  const validValues: ModeType[] = ['cors', 'no-cors', 'same-origin', 'navigate'];
  return validValues.includes(value as ModeType);
}

// Exportar para todos os métodos HTTP mapeados corretamente
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};