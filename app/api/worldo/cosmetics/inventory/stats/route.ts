// app/api/worldo/cosmetics/inventory/stats/route.ts
// Rota /api/worldo/cosmetics/inventory/stats: contagem de itens do inventário por situação,
// respeitando os mesmos filtros de busca e raridade da listagem do inventário.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { parseRarities } from '@/lib/api/rarityParam';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/worldo/cosmetics/inventory/stats — retorna { all, listed, unlisted } com o total de
 * itens do usuário.
 *
 * Query: search (parte do nome da moldura, sem diferenciar maiúsculas), rarity (uma ou mais,
 * separadas por vírgula) e filter (listed|unlisted, opcional).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search')?.trim() || '';
    const rarities = parseRarities(searchParams.get('rarity'));

    const whereCondition: Prisma.user_frame_itemWhereInput = { ownerId: session.user.id };

    if (filter === 'listed') {
      whereCondition.isListed = true;
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false;
    }

    // Mesmos filtros da grade: nome da moldura e raridades
    if (search || rarities.length > 0) {
      whereCondition.frame = {
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(rarities.length > 0 && { rarity: { in: rarities } }),
      };
    }

    // Contagem agrupada por isListed em uma consulta
    const result = await prisma.user_frame_item.groupBy({
      by: ['isListed'],
      where: whereCondition,
      _count: true,
    });

    const listed = result.find((r) => r.isListed === true)?._count || 0;
    const unlisted = result.find((r) => r.isListed === false)?._count || 0;

    return NextResponse.json({
      all: listed + unlisted,
      listed,
      unlisted,
    });
  } catch (error) {
    console.error('Erro ao buscar stats do inventário:', error);
    return NextResponse.json({ error: 'Erro ao buscar stats' }, { status: 500 });
  }
}
