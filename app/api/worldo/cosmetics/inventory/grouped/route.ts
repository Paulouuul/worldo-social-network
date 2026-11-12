// app/api/worldo/cosmetics/inventory/grouped/route.ts
// Rota /api/worldo/cosmetics/inventory/grouped: inventário do usuário agrupado por moldura (itens
// não anunciados) ou por anúncio (itens à venda), com filtros e paginação.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { parseRarities } from '@/lib/api/rarityParam';
import { SORT } from '@/constants/marketplace';

/**
 * GET /api/worldo/cosmetics/inventory/grouped — grupos do inventário com contagem, item
 * equipado e menor preço de revenda.
 *
 * Query: filter (all|listed|unlisted), search (nome), rarity (uma ou mais, separadas por vírgula),
 * sort (newest|oldest pela última atividade), page e limit. Agrupa e filtra em memória.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search') || '';
    const rarities = parseRarities(searchParams.get('rarity'));
    const sort = searchParams.get('sort') || SORT.newest;
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Grupo por anúncio (itens à venda) ou por moldura (itens livres)
    const groupedMap = new Map();

    items.forEach((item) => {
      const listingId = item.isListed ? item.listingId : null;

      let key;
      if (item.isListed && item.listingId) {
        key = `listed-${item.listingId}`;
      } else {
        key = `unlisted-${item.frameId}`;
      }

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: key,
          frameId: item.frameId,
          isListed: item.isListed,
          resalePrice: item.resalePrice,
          isEquipped: false,
          equippedItemId: null,
          count: 0,
          frame: item.frame,
          listingId: listingId,
          lastActivityAt: item.updatedAt,
        });
      }

      const group = groupedMap.get(key);
      group.count++;
      if (item.isEquipped) {
        group.isEquipped = true;
        group.equippedItemId = item.id;
      }
      if (item.updatedAt > group.lastActivityAt) {
        group.lastActivityAt = item.updatedAt;
      }
      if (item.resalePrice && (!group.resalePrice || item.resalePrice < group.resalePrice)) {
        group.resalePrice = item.resalePrice;
      }
    });

    let allGroupedItems = Array.from(groupedMap.values());

    if (search) {
      const searchLower = search.toLowerCase();
      allGroupedItems = allGroupedItems.filter((item) =>
        item.frame.name.toLowerCase().includes(searchLower),
      );
    }

    if (rarities.length > 0) {
      allGroupedItems = allGroupedItems.filter((item) => rarities.includes(item.frame.rarity));
    }

    // Ordena pela última atividade do grupo
    allGroupedItems.sort((a, b) => {
      if (sort === SORT.oldest) {
        const dateA = new Date(a.lastActivityAt).getTime();
        const dateB = new Date(b.lastActivityAt).getTime();
        return dateA - dateB;
      } else {
        const dateA = new Date(a.lastActivityAt).getTime();
        const dateB = new Date(b.lastActivityAt).getTime();
        return dateB - dateA;
      }
    });

    const totalCount = allGroupedItems.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedItems = allGroupedItems.slice(skip, skip + limit);

    const hasMore = page < totalPages;

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      hasMore,
    });
  } catch (error) {
    console.error('Erro ao buscar inventário agrupado:', error);
    return NextResponse.json({ error: 'Erro ao buscar inventário' }, { status: 500 });
  }
}
