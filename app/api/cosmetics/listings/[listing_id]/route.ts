// app/api/cosmetics/listings/[listing_id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { listing_id: string } }
) {
  try {
    const { listing_id } = await params

    // 1. Buscar o anúncio específico
    const listing = await prisma.cosmetic_listing.findUnique({
      where: { 
        id: listing_id, 
        isActive: true,
        quantity: { gt: 0 }
      },
      include: {
        frame: {
          include: {
            creator: {
              select: {
                publicId: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                equippedFrame: {
                  select: { imageUrl: true, rarity: true }
                }
              }
            }
          }
        },
        seller: {
          select: {
            publicId: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            createdAt: true,
            equippedFrame: {
              select: { imageUrl: true, rarity: true }
            }
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Anúncio não encontrado ou indisponível' },
        { status: 404 }
      )
    }

    // 2. Buscar outros anúncios do mesmo vendedor
    const sellerOtherListings = await prisma.cosmetic_listing.findMany({
      where: {
        sellerId: listing.sellerId,
        id: { not: listing.id },
        isActive: true,
        quantity: { gt: 0 }
      },
      include: {
        frame: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            rarity: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    })

    return NextResponse.json({
      id: listing.id,
      priceCoins: listing.priceCoins,
      quantity: listing.quantity,
      createdAt: listing.createdAt,
      frame: {
        id: listing.frame.id,
        name: listing.frame.name,
        description: listing.frame.description,
        imageUrl: listing.frame.imageUrl,
        thumbnailUrl: listing.frame.thumbnailUrl,
        rarity: listing.frame.rarity,
        creator: {
          id: listing.frame.creator.publicId,
          name: listing.frame.creator.name,
          username: listing.frame.creator.username,
          avatar: listing.frame.creator.avatar,
          bio: listing.frame.creator.bio,
          memberSince: listing.frame.creator.createdAt,
          equippedFrame: listing.frame.creator.equippedFrame
        }
      },
      seller: {
        id: listing.seller.publicId,
        name: listing.seller.name,
        username: listing.seller.username,
        avatar: listing.seller.avatar,
        bio: listing.seller.bio,
        memberSince: listing.seller.createdAt,
        equippedFrame: listing.seller.equippedFrame
      },
      sellerOtherListings: sellerOtherListings.map(item => ({
        id: item.id,
        priceCoins: item.priceCoins,
        quantity: item.quantity,
        frame: {
          id: item.frame.id,
          name: item.frame.name,
          thumbnailUrl: item.frame.thumbnailUrl,
          rarity: item.frame.rarity,
        }
      }))
    })

  } catch (error) {
    console.error('Erro ao buscar anúncio:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar anúncio' },
      { status: 500 }
    )
  }
}