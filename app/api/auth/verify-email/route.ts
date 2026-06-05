import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return new Response('Token não fornecido', { status: 400 });
    }

    // Buscar token no banco
    const verificationToken = await prisma.verification_tokens.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return new Response('Token inválido', { status: 400 });
    }

    // Verificar se token expirou
    if (verificationToken.expires < new Date()) {
      await prisma.verification_tokens.delete({ where: { token } });
      return new Response('Token expirado. Solicite um novo link de verificação.', { status: 400 });
    }

    // Atualizar usuário como verificado
    await prisma.users.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Remover token usado
    await prisma.verification_tokens.delete({ where: { token } });

    // Redirecionar para página de login com mensagem de sucesso
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL);
    loginUrl.searchParams.set('verified', 'true');

    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Erro na verificação:', error);
    return new Response('Erro interno ao verificar email', { status: 500 });
  }
}
