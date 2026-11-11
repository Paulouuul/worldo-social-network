// app/api/worldo/cosmetics/inventory/route.ts
// Rota /api/worldo/cosmetics/inventory: itens individuais do inventário do usuário, paginados.

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/worldo/cosmetics/inventory — itens do usuário (com a moldura), mais recentes
 * primeiro. Query: filter (all|listed|unlisted), page e limit.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereCondition: any = { ownerId: session.user.id };

    if (filter === 'listed') {
      whereCondition.isListed = true;
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false;
    }

    const items = await prisma.user_frame_item.findMany({
      where: whereCondition,
      include: {
        frame: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
    });

    const totalCount = await prisma.user_frame_item.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar inventário:', error);
    return NextResponse.json({ error: 'Erro ao buscar inventário' }, { status: 500 });
  }
}
