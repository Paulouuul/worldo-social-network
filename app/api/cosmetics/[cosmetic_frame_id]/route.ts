import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { cosmetic_frame_id: string } }
) {
  try {

    const session = await auth()

    if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 401 }
          )
        }

    const { cosmetic_frame_id } = await params

    const frame = await prisma.cosmetic_frame.findUnique({
      where: { id: cosmetic_frame_id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            createdAt: true,
          }
        },
        listings: {
          where: { isActive: true, quantity: { gt: 0 } },
          select: {
            id: true,
            quantity: true,
            priceCoins: true,
            createdAt: true,
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
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
                avatar: true,
              }
            },
            likes: true
          }
        },
        purchases: {
          take: 10,
          orderBy: { purchasedAt: 'desc' },
          include: {
            buyer: {
              select: { name: true, username: true, avatar: true }
            }
          }
        },
        items: {
          where: { isListed: false },
          select: { ownerId: true, isEquipped: true }
        }
      }
    })

    if (!frame) {
      return NextResponse.json(
        { error: 'Moldura não encontrada' },
        { status: 404 }
      )
    }

    // Calcular estatísticas adicionais
    const stats = {
      totalSold: frame.soldCount,
      totalInCirculation: frame.items.length,
      totalEquipped: frame.items.filter(i => i.isEquipped).length,
      averageRating: frame.avgRating,
      totalReviews: frame.totalReviews,
      ratingDistribution: {
        5: frame.total5Stars,
        4: frame.total4Stars,
        3: frame.total3Stars,
        2: frame.total2Stars,
        1: frame.total1Stars,
      }
    }

    // Buscar anúncio mais barato (se houver vários)
    const cheapestListing = frame.listings.length > 0
      ? frame.listings.reduce((min, listing) => 
          listing.priceCoins < min.priceCoins ? listing : min, frame.listings[0])
      : null

    return NextResponse.json({
      ...frame,
      stats,
      cheapestListing,
      hasActiveListing: frame.listings.length > 0,
      totalListings: frame.listings.length,
    })

  } catch (error) {
    console.error('Erro ao buscar moldura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar moldura' },
      { status: 500 }
    )
  }
}