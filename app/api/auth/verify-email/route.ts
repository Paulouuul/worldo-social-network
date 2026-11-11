// app/api/auth/verify-email/route.ts
// Rota /api/auth/verify-email: confirma o email do cadastro a partir do token enviado por email.

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/verify-email?token=... — valida o token de verificação, marca o email como
 * verificado, apaga o token e redireciona para /login?verified=true. Tokens expirados são apagados.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return new Response('Token não fornecido', { status: 400 });
    }

    const verificationToken = await prisma.verification_tokens.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return new Response('Token inválido', { status: 400 });
    }

    // Token expirado é descartado
    if (verificationToken.expires < new Date()) {
      await prisma.verification_tokens.delete({ where: { token } });
      return new Response('Token expirado. Solicite um novo link de verificação.', { status: 400 });
    }

    await prisma.users.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Token é de uso único
    await prisma.verification_tokens.delete({ where: { token } });

    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL);
    loginUrl.searchParams.set('verified', 'true');

    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Erro na verificação:', error);
    return new Response('Erro interno ao verificar email', { status: 500 });
  }
}
