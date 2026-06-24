// app/api/cosmetics/listings/platform_fee/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const activeFee = await prisma.platform_fee.findFirst({
      where: { isActive: true },
    });

    const fee = activeFee?.feeValue ?? 5;

    return NextResponse.json({ success: true, platform_fee: fee }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar taxa:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar taxa' }, { status: 500 });
  }
}
