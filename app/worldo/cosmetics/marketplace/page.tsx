import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const listings = await prisma.cosmetic_listing.findMany({
      where: { 
        isActive: true,
        quantity: { gt: 0 }  // apenas com estoque
      },
      include: {
        frame: {
          include: {
            creator: {
              select: { 
                id: true,
                name: true, 
                username: true, 
                avatar: true 
              }
            }
          }
        },
        seller: {
          select: { 
            id: true,
            name: true, 
            username: true, 
            avatar: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Erro ao buscar marketplace:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar marketplace' },
      { status: 500 }
    )
  }
}