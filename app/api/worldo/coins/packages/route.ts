// app/api/worldo/coins/packages/route.ts
// Rota /api/worldo/coins/packages: lista os pacotes de moedas ativos.

import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

/** Revalidação do cache da rota (segundos). */
export const revalidate = 3600;

/**
 * GET /api/worldo/coins/packages — pacotes ativos ordenados por quantidade de moedas (moedas e
 * bônus convertidos de BigInt para número).
 */
export async function GET() {
  try {
    const packages = await prisma.coin_package.findMany({
      where: { isActive: true },
      orderBy: { coins: 'asc' },
    });

    const serializedPackages = packages.map((pkg) => ({
      ...pkg,
      coins: Number(pkg.coins),
      bonusCoins: Number(pkg.bonusCoins),
    }));

    return NextResponse.json(serializedPackages, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return NextResponse.json({ error: 'Erro ao buscar pacotes' }, { status: 500 });
  }
}
