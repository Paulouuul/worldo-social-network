import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const packages = await prisma.coin_package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
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
