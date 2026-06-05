// proxy.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = req.nextUrl.pathname;

  console.log('Proxy - path:', pathname, 'token:', !!token);

  // Usuário autenticado na raiz → /worldo
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/worldo', req.url));
  }

  // Usuário NÃO autenticado em /worldo/* → /
  if (!token && (pathname.startsWith('/worldo') || pathname === '/')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// Configurar em quais rotas o middleware executa
export const config = {
  matcher: ['/', '/login', '/register', '/worldo/:path*'],
};
