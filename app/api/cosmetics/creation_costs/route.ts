// app/api/cosmetics/creation-costs/route.ts
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

    // Construir o where clause
    let whereClause: any = {};

    if (rarityParam && rarityParam !== 'all') {
      const validRarities = Object.values(Rarity);
      if (validRarities.includes(rarityParam as Rarity)) {
        whereClause.rarity = rarityParam as Rarity;
      } else {
        return NextResponse.json({ error: 'Raridade inválida.' }, { status: 400 });
      }
    }

    // Buscar os custos de criação
    const costs = await prisma.cosmetic_creation_cost.findMany({
      where: whereClause,
      orderBy: {
        costCoins: 'asc',
      },
    });

    // Se não especificou rarity, retorna agrupado por rarity
    if (!rarityParam || rarityParam === 'all') {
      const grouped = costs.reduce(
        (acc, cost) => {
          const key = cost.rarity;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(cost);
          return acc;
        },
        {} as Record<Rarity, typeof costs>,
      );

      return NextResponse.json(grouped);
    }

    // Retorna o custo específico ou array
    return NextResponse.json(costs);
  } catch (error) {
    console.error('Erro ao buscar custos de criação:', error);
    return NextResponse.json({ error: 'Erro ao buscar custos de criação' }, { status: 500 });
  }
}
