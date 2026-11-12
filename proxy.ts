// proxy.ts
// Proxy (middleware) do Next.js: redireciona usuários autenticados de /, /login e /register para
// /worldo e não autenticados de / e /worldo/* para /login, lendo o JWT da sessão.

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';

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
  if (
    token &&
    (pathname === ROUTES.root || pathname === ROUTES.login || pathname === ROUTES.register)
  ) {
    return NextResponse.redirect(new URL(ROUTES.home, req.url));
  }

  // Não autenticado em / ou /worldo/* → /login
  if (!token && (pathname.startsWith(ROUTES.home) || pathname === ROUTES.root)) {
    return NextResponse.redirect(new URL(ROUTES.login, req.url));
  }

  return NextResponse.next();
}

/** Rotas em que o proxy executa. */
export const config = {
  // O Next.js lê o matcher estaticamente no build: precisa ser literal (equivale a ROUTES.root,
  // ROUTES.login, ROUTES.register e ROUTES.home/*)
  matcher: ['/', '/login', '/register', '/worldo/:path*'],
};
