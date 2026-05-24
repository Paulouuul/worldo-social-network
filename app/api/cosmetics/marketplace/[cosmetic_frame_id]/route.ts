import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { cosmetic_frame_id: string } }
) {
  try {
    const { cosmetic_frame_id } = await params

    const frame = await prisma.cosmetic_frame.findUnique({
      where: { id: cosmetic_frame_id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        listings: {
          where: { isActive: true, quantity: { gt: 0 } },
          select: {
            id: true,
            quantity: true,
            priceCoins: true,
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true
              }
            },
            likes: true
          }
        }
      }
    })

    if (!frame) {
      return NextResponse.json(
        { error: 'Moldura não encontrada' },
        { status: 404 }
      )
    }

    // Calcular estatísticas
    const totalListings = frame.listings.length
    const cheapestListing = frame.listings.length > 0
      ? frame.listings.reduce((min, listing) =>
          listing.priceCoins < min.priceCoins ? listing : min, frame.listings[0])
      : null

    // Distribuição de avaliações
    const ratingDistribution = {
      1: frame.total1Stars,
      2: frame.total2Stars,
      3: frame.total3Stars,
      4: frame.total4Stars,
      5: frame.total5Stars
    }

    return NextResponse.json({
      id: frame.id,
      name: frame.name,
      description: frame.description,
      imageUrl: frame.imageUrl,
      thumbnailUrl: frame.thumbnailUrl,
      rarity: frame.rarity,
      stock: frame.stock,
      soldCount: frame.soldCount,
      totalSales: frame.totalSales,
      avgRating: frame.avgRating,
      totalReviews: frame.totalReviews,
      ratingDistribution,
      createdAt: frame.createdAt,
      creator: frame.creator,
      listings: frame.listings,
      totalListings,
      cheapestListing,
      hasActiveListing: totalListings > 0
    })
  } catch (error) {
    console.error('Erro ao buscar moldura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar moldura' },
      { status: 500 }
    )
  }
}