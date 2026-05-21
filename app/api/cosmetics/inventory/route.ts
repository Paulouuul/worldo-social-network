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

    let whereCondition: any = { ownerId: session.user.id }

    if (filter === 'listed') {
      whereCondition.isListed = true
    } else if (filter === 'unlisted') {
      whereCondition.isListed = false
    }

    const items = await prisma.user_frame_item.findMany({
      where: whereCondition,
      include: {
        frame: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Erro ao buscar inventário:', error)
    return NextResponse.json({ error: 'Erro ao buscar inventário' }, { status: 500 })
  }
}