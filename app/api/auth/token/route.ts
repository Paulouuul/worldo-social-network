// worldo-social-network/app/api/auth/token/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { generateJwtToken } from '@/lib/backend-jwt-token-generator';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Gera o token JWT para o Backend
    const jwtToken = await generateJwtToken(session);

    // Token é o JWT
    return NextResponse.json({ jwtToken });
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
