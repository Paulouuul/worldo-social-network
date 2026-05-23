import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    let whereCondition: any = { ownerId: session.user.id }

    if (filter === 'listed') {
      whereCondition.isListed = true
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false
    }

    // Buscar items com paginação
    const items = await prisma.user_frame_item.findMany({
      where: whereCondition,
      include: {
        frame: true
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit
    })

    // Contar total de items (sem paginação)
    const totalCount = await prisma.user_frame_item.count({
      where: whereCondition
    })

    const totalPages = Math.ceil(totalCount / limit)

    // Retornar os items + metadados de paginação
    return NextResponse.json({
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Erro ao buscar inventário:', error)
    return NextResponse.json({ error: 'Erro ao buscar inventário' }, { status: 500 })
  }
}