import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
