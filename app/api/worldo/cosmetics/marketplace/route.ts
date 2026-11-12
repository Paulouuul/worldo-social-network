// app/api/worldo/cosmetics/marketplace/route.ts
// Rota /api/worldo/cosmetics/marketplace: busca paginada de anúncios ativos no Elasticsearch,
// excluindo os anúncios do próprio usuário.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { esClient, LISTINGS_INDEX } from '@/lib/search/elasticsearch';
import { NextRequest, NextResponse } from 'next/server';
import { parseRarities } from '@/lib/api/rarityParam';
import { SORT } from '@/constants/marketplace';

/** Maior posição paginável com from/size (max_result_window padrão do Elasticsearch). */
const ES_MAX_RESULT_WINDOW = 10_000;

/**
 * GET /api/worldo/cosmetics/marketplace — anúncios ativos com estoque.
 *
 * Query: rarity (uma ou mais, separadas por vírgula), search (prefixo do nome, descrição, criador e vendedor), sort
 * (newest|oldest|price_asc|price_desc), page e limit (1–100). Retorna listings, total (limitado
 * a 10.000), hasMore e ownedFrameIds (molduras da página que o usuário já possui).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const rarities = parseRarities(searchParams.get('rarity'));
    const sort = searchParams.get('sort') || SORT.newest;
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

    // Filtros: ativos e com estoque
    const must: any[] = [{ term: { isActive: true } }, { range: { quantity: { gt: 0 } } }];

    // Exclui anúncios do próprio usuário
    if (session?.user?.id) {
      must.push({
        bool: {
          must_not: { term: { sellerId: session.user.id } },
        },
      });
    }

    // Filtro por raridade
    if (rarities.length > 0) {
      must.push({ terms: { frameRarity: rarities } });
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
      case SORT.priceAsc:
        sortField = [{ priceCoins: { order: 'asc' } }, { createdAt: { order: 'desc' } }];
        break;
      case SORT.priceDesc:
        sortField = [{ priceCoins: { order: 'desc' } }, { createdAt: { order: 'desc' } }];
        break;
      case SORT.oldest:
        sortField = [{ createdAt: { order: 'asc' } }];
        break;
      default:
        sortField = [{ createdAt: { order: 'desc' } }];
    }

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

    // Converte os documentos do índice para o formato da API
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

    // Molduras da página que o usuário já possui
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
    return NextResponse.json({ error: 'Erro ao carregar marketplace' }, { status: 500 });
  }
}
