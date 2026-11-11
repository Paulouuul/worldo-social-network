// app/api/cosmetics/marketplace/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { esClient, LISTINGS_INDEX } from '@/lib/elasticsearch';
import { NextRequest, NextResponse } from 'next/server';
import { Rarity } from '@prisma/client';

const ES_MAX_RESULT_WINDOW = 10_000;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const rarityParam = searchParams.get('rarity');
    let rarityFilter: Rarity | undefined;
    if (rarityParam && rarityParam !== 'all') {
      const validRarities = Object.values(Rarity);
      if (validRarities.includes(rarityParam as Rarity)) {
        rarityFilter = rarityParam as Rarity;
      }
      // Se for inválido, pode ignorar ou retornar erro
    }
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12'), 1), 100);
    const from = (page - 1) * limit;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Elasticsearch não pagina além de max_result_window (padrão 10.000) com from/size.
    // Fora da janela, busca só o total (size 0) e devolve a página vazia.
    const size = Math.max(0, Math.min(limit, ES_MAX_RESULT_WINDOW - from));

    // Construir query do Elasticsearch
    const must: any[] = [{ term: { isActive: true } }, { range: { quantity: { gt: 0 } } }];

    // Excluir itens do próprio usuário
    if (session?.user?.id) {
      must.push({
        bool: {
          must_not: { term: { sellerId: session.user.id } },
        },
      });
    }

    // Filtro por raridade
    if (rarityFilter) {
      must.push({ term: { frameRarity: rarityFilter } });
    }

    // Busca por texto
    if (search) {
      must.push({
        bool: {
          should: [
            {
              prefix: {
                frameName: {
                  value: search,
                  boost: 3,
                  case_insensitive: true,
                },
              },
            },
            {
              match: {
                frameDescription: {
                  query: search,
                  fuzziness: 'AUTO',
                },
              },
            },
            {
              match: {
                creatorName: {
                  query: search,
                  fuzziness: 'AUTO',
                },
              },
            },
            {
              match: {
                sellerName: {
                  query: search,
                  fuzziness: 'AUTO',
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    }

    // Ordenação
    let sortField: any = [];
    switch (sort) {
      case 'price_asc':
        sortField = [{ priceCoins: { order: 'asc' } }, { createdAt: { order: 'desc' } }];
        break;
      case 'price_desc':
        sortField = [{ priceCoins: { order: 'desc' } }, { createdAt: { order: 'desc' } }];
        break;
      case 'oldest':
        sortField = [{ createdAt: { order: 'asc' } }];
        break;
      default:
        sortField = [{ createdAt: { order: 'desc' } }];
    }

    // Buscar no Elasticsearch
    const response = await esClient.search({
      index: LISTINGS_INDEX,
      from: size > 0 ? from : 0,
      size,
      query: { bool: { must } },
      sort: sortField,
      track_total_hits: true,
    });

    const hits = response.hits.hits;
    const realTotal =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;
    // O total exposto é limitado à janela paginável, para a grade não pedir páginas inacessíveis
    const total = Math.min(realTotal, ES_MAX_RESULT_WINDOW);
    const hasMore = from + limit < total;

    // Mapear resultados para o formato esperado
    const listings = hits.map((hit: any) => ({
      id: hit._id,
      frameId: hit._source.frameId,
      sellerId: hit._source.sellerId,
      priceCoins: Number(hit._source.priceCoins),
      quantity: hit._source.quantity,
      isActive: hit._source.isActive,
      createdAt: hit._source.createdAt,
      updatedAt: hit._source.updatedAt,
      frame: {
        id: hit._source.frameId,
        name: hit._source.frameName,
        rarity: hit._source.frameRarity,
        description: hit._source.frameDescription,
        imageUrl: hit._source.frameImageUrl || hit._source.frameImage || '',
        thumbnailUrl:
          hit._source.frameThumbnailUrl ||
          hit._source.frameImageUrl ||
          hit._source.frameImage ||
          '',
        creator: {
          name: hit._source.creatorName,
          username: hit._source.creatorUsername,
          avatar: hit._source.creatorAvatar || null,
        },
      },
      seller: {
        publicId: hit._source.sellerId,
        name: hit._source.sellerName,
        username: hit._source.sellerUsername,
        avatar: hit._source.sellerAvatar,
      },
    }));

    // Verificar se o usuário já possui cada item
    let ownedFrameIds: string[] = [];
    if (session?.user?.id && listings.length > 0) {
      const ownedItems = await prisma.user_frame_item.findMany({
        where: {
          ownerId: session.user.id,
          frameId: { in: listings.map((l) => l.frameId) },
        },
        select: { frameId: true },
      });
      ownedFrameIds = [...new Set(ownedItems.map((item) => item.frameId))];
    }

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore,
      ownedFrameIds,
    });
  } catch (error) {
    console.error('Erro ao buscar marketplace:', error);
    // Fallback para PostgreSQL em caso de erro
    return NextResponse.json({ error: 'Erro ao carregar marketplace' }, { status: 500 });
  }
}
