// app/api/cosmetics/seller/[user_identifier]/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Rarity, Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { user_identifier: string } },
) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    // Parâmetros de filtro
    const { user_identifier } = await params; // ← SEM await, params é síncrono no Next 16
    const rarityParam = searchParams.get('rarity');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const from = (page - 1) * limit;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // VALIDAÇÃO: user_identifier é obrigatório
    if (!user_identifier) {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 400 });
    }

    // Buscar o usuário pelo username ou publicId
    const seller = await prisma.users.findFirst({
      where: {
        OR: [{ username: user_identifier }, { publicId: user_identifier }],
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        equippedFrame: {
          select: {
            imageUrl: true,
            rarity: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }

    // Construir where clause para o Prisma usando o ID do vendedor encontrado
    const where: Prisma.cosmetic_listingWhereInput = {
      isActive: true,
      quantity: { gt: 0 },
      sellerId: seller.id,
    };

    // Filtrar por raridade
    if (rarityParam && rarityParam !== 'all') {
      const validRarities = Object.values(Rarity);
      if (validRarities.includes(rarityParam as Rarity)) {
        where.frame = {
          rarity: rarityParam as Rarity,
        };
      }
    }

    // Busca por texto
    if (search) {
      where.OR = [
        {
          frame: {
            name: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        },
        {
          frame: {
            description: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        },
        {
          frame: {
            creator: {
              name: {
                contains: search,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
        },
        {
          frame: {
            creator: {
              username: {
                contains: search,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
        },
      ];
    }

    // Determinar ordenação
    let orderBy: Prisma.cosmetic_listingOrderByWithRelationInput = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { priceCoins: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceCoins: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      default: // 'newest'
        orderBy = { createdAt: 'desc' };
    }

    // Buscar total de itens para paginação
    const total = await prisma.cosmetic_listing.count({ where });

    // Buscar listings com todos os relacionamentos
    const listings = await prisma.cosmetic_listing.findMany({
      where,
      skip: from,
      take: limit,
      orderBy,
      include: {
        frame: {
          include: {
            creator: {
              select: {
                id: true,
                publicId: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            publicId: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Verificar se o usuário já possui cada item
    let ownedFrameIds: string[] = [];
    if (session?.user?.id && listings.length > 0) {
      const frameIds = listings.map((listing) => listing.frameId);
      const ownedItems = await prisma.user_frame_item.findMany({
        where: {
          ownerId: session.user.id,
          frameId: { in: frameIds },
        },
        select: { frameId: true },
      });
      ownedFrameIds = ownedItems.map((item) => item.frameId);
    }

    // Formatar resposta
    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      frameId: listing.frameId,
      sellerId: listing.sellerId,
      priceCoins: Number(listing.priceCoins),
      quantity: listing.quantity,
      isActive: listing.isActive,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      frame: {
        id: listing.frame.id,
        name: listing.frame.name,
        rarity: listing.frame.rarity,
        description: listing.frame.description,
        imageUrl: listing.frame.imageUrl || '',
        thumbnailUrl: listing.frame.thumbnailUrl || listing.frame.imageUrl || '',
        creator: {
          id: listing.frame.creator.publicId,
          name: listing.frame.creator?.name || null,
          username: listing.frame.creator?.username || null,
          avatar: listing.frame.creator?.avatar || null,
        },
      },
      seller: {
        publicId: listing.seller.publicId,
        name: listing.seller.name,
        username: listing.seller.username,
        avatar: listing.seller.avatar,
      },
    }));

    // Retornar também informações do vendedor
    return NextResponse.json({
      seller: {
        id: seller.publicId,
        name: seller.name,
        username: seller.username,
        avatar: seller.avatar,
        bio: seller.bio,
        memberSince: seller.createdAt,
        equippedFrame: seller.equippedFrame,
      },
      listings: formattedListings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      ownedFrameIds,
      sellerId: seller.id,
    });
  } catch (error) {
    console.error('Erro ao buscar marketplace do vendedor:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar marketplace do vendedor' },
      { status: 500 },
    );
  }
}
