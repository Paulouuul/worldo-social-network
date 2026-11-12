// app/api/worldo/cosmetics/listings/platform_fee/route.ts
// Rota /api/worldo/cosmetics/listings/platform_fee: taxa percentual cobrada pela plataforma nas
// vendas.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/worldo/cosmetics/listings/platform_fee — retorna { platform_fee } da taxa ativa (5%
 * quando não há taxa cadastrada).
 */
export async function GET() {
  try {
    // Exige sessão
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
