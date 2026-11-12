// app/api/worldo/cosmetics/inventory/stats/route.ts
// Rota /api/worldo/cosmetics/inventory/stats: contagem de itens do inventário por situação.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/worldo/cosmetics/inventory/stats — retorna { all, listed, unlisted } com o total de
 * itens do usuário. Aceita ?filter=listed|unlisted.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let whereCondition: any = { ownerId: session.user.id };

    if (filter === 'listed') {
      whereCondition.isListed = true;
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false;
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
