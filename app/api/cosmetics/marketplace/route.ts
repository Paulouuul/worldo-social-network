// app/api/cosmetics/marketplace/route.ts
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const rarity = searchParams.get('rarity')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      isActive: true,
      quantity: { gt: 0 }
    }

    if (session?.user?.id) {
      where.sellerId = { not: session.user.id }
    }

    if (rarity && rarity !== 'all') {
      where.frame = { rarity }
    }

    if (search) {
      where.frame = {
        ...where.frame,
        name: { contains: search, mode: 'insensitive' }  // PostgreSQL
      }

    }

    // Ordenação
    let orderBy: any = {}
    switch (sort) {
      case 'price_asc':
        orderBy = { priceCoins: 'asc' }
        break
      case 'price_desc':
        orderBy = { priceCoins: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Buscar listagens
    const [listings, total] = await Promise.all([
      prisma.cosmetic_listing.findMany({
        where,
        include: {
          frame: {
            include: {
              creator: {
                select: {
                  name: true,
                  username: true,
                  avatar: true
                }
              }
            }
          },
          seller: {
            select: {
              publicId: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.cosmetic_listing.count({ where })
    ])

    // Verificar se o usuário já possui cada item (se estiver logado)
    let ownedFrameIds: string[] = []
    if (session?.user?.id) {
      const ownedItems = await prisma.user_frame_item.findMany({
        where: {
          ownerId: session.user.id,
          frameId: { in: listings.map(l => l.frameId) }
        },
        select: { frameId: true }
      })
      ownedFrameIds = ownedItems.map(item => item.frameId)
    }

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      ownedFrameIds
    })
  } catch (error) {
    console.error('Erro ao buscar marketplace:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar marketplace' },
      { status: 500 }
    )
  }
}