// proxy.ts
// Proxy (middleware) do Next.js: redireciona usuários autenticados de /, /login e /register para
// /worldo e não autenticados de / e /worldo/* para /login, lendo o JWT da sessão.

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Decide o redirecionamento conforme a presença do token de sessão. */
export async function proxy(req: NextRequest) {
  const isSecure =
    req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isSecure,
  });

  const pathname = req.nextUrl.pathname;

  // Autenticado em /, /login ou /register → /worldo
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/worldo', req.url));
  }

  // Não autenticado em / ou /worldo/* → /login
  if (!token && (pathname.startsWith('/worldo') || pathname === '/')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

/** Rotas em que o proxy executa. */
export const config = {
  matcher: ['/', '/login', '/register', '/worldo/:path*'],
};
