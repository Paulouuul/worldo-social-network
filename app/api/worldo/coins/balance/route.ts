// app/api/worldo/coins/balance/route.ts
// Rota /api/worldo/coins/balance: saldo de moedas do usuário logado.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

/** GET /api/worldo/coins/balance — retorna { balance } do usuário autenticado. 401 sem sessão. */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    });

    return NextResponse.json({ balance: Number(user?.coins || 0) });
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return NextResponse.json({ error: 'Erro ao buscar saldo' }, { status: 500 });
  }
}
