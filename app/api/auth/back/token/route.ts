// app/api/auth/back/token/route.ts
// Rota /api/auth/back/token: emite o JWT de curta duração usado pelo navegador para chamar o
// backend Python.

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { generateJwtToken } from '@/lib/backend-jwt-token-generator';

/** GET /api/auth/back/token — gera o JWT do backend a partir da sessão. 401 sem sessão. */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Gera o JWT do backend a partir da sessão
    const token = await generateJwtToken(session);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
