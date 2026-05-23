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
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    let whereCondition: any = { ownerId: session.user.id }

    if (filter === 'listed') {
      whereCondition.isListed = true
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false
    }

    // Buscar todos os itens com seus frames
    const items = await prisma.user_frame_item.findMany({
      where: whereCondition,
      include: {
        frame: true
      },
      orderBy: {
        updatedAt: 'desc'  // Ordenar por atualização mais recente
      }
    })

    // Agrupar manualmente
    const groupedMap = new Map()
    
    items.forEach(item => {
      const listingId = item.isListed ? item.listingId : null
      // const key = `${item.frameId}-${item.isListed}`

      let key
      if (item.isListed && item.listingId) {
        // Itens listados: agrupa pelo listingId (cada anúncio é um grupo separado)
        key = `listed-${item.listingId}`
      } else {
        // Itens não listados: agrupa pelo frameId
        key = `unlisted-${item.frameId}`
      }
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: key,
          frameId: item.frameId,
          isListed: item.isListed,
          resalePrice: item.resalePrice,
          
          count: 0,
          frame: item.frame,
          listingId: listingId,
          lastActivityAt: item.updatedAt  // Usar updatedAt como atividade
        })
      }
      
      const group = groupedMap.get(key)
      group.count++
      
      // Atualizar a data mais recente se este item for mais novo
      if (item.updatedAt > group.lastActivityAt) {
        group.lastActivityAt = item.updatedAt
      }
      
      // Manter o menor preço
      if (item.resalePrice && (!group.resalePrice || item.resalePrice < group.resalePrice)) {
        group.resalePrice = item.resalePrice
      }
    })

    // Converter para array
    const allGroupedItems = Array.from(groupedMap.values())
    
    // Ordenar pela data mais recente (já vem ordenado pela query)
    allGroupedItems.sort((a, b) => {
      const dateA = new Date(a.lastActivityAt).getTime()
      const dateB = new Date(b.lastActivityAt).getTime()
      return dateB - dateA
    })

    // Paginação
    const totalCount = allGroupedItems.length
    const totalPages = Math.ceil(totalCount / limit)
    const paginatedItems = allGroupedItems.slice(skip, skip + limit)

    return NextResponse.json({
      items: paginatedItems,
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
    console.error('Erro ao buscar inventário agrupado:', error)
    return NextResponse.json({ error: 'Erro ao buscar inventário' }, { status: 500 })
  }
}