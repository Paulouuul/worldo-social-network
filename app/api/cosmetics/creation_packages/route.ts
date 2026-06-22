import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Rarity } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rarityParam = searchParams.get('rarity');
    let rarityFilter: Rarity | undefined;
    if (rarityParam && rarityParam !== '') {
      const validRarities = Object.values(Rarity);
      if (validRarities.includes(rarityParam as Rarity)) {
        rarityFilter = rarityParam as Rarity;
      } else {
        return NextResponse.json(
          { error: 'Raridade inválida. Valores permitidos: COMUM, RARO, EPICO, LENDARIO' },
          { status: 400 },
        );
      }
    }
    const whereClause: any = {
      isActive: true,
    };

    if (rarityFilter) {
      whereClause.rarity = rarityFilter;
    }

    const packages = await prisma.cosmetic_creation_package.findMany({
      where: whereClause,
      orderBy: [{ rarity: 'asc' }, { sortOrder: 'asc' }],
    });

    // Se não especificou rarity, retorna agrupado
    if (!rarityFilter) {
      const grouped = packages.reduce(
        (acc, pkg) => {
          if (!acc[pkg.rarity]) {
            acc[pkg.rarity] = [];
          }
          acc[pkg.rarity].push(pkg);
          return acc;
        },
        {} as Record<string, typeof packages>,
      );

      return NextResponse.json(grouped);
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar pacotes' }, { status: 500 });
  }
}
