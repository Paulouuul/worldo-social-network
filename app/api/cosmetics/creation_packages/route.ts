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
    const rarity = searchParams.get('rarity')

    const whereClause: any = {
      isActive: true
    }

    if (rarity && rarity !== '') {
      whereClause.rarity = rarity
    }

    const packages = await prisma.cosmetic_creation_package.findMany({
      where: whereClause,
      orderBy: [
        { rarity: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    // Se não especificou rarity, retorna agrupado
    if (!rarity) {
      const grouped = packages.reduce((acc, pkg) => {
        if (!acc[pkg.rarity]) {
          acc[pkg.rarity] = []
        }
        acc[pkg.rarity].push(pkg)
        return acc
      }, {} as Record<string, typeof packages>)

      return NextResponse.json(grouped)
    }

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error)
    return NextResponse.json({ error: 'Erro interno ao buscar pacotes' }, { status: 500 })
  }
}