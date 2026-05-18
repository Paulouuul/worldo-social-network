import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_identifier: string }> }
) {
  try {
    const { user_identifier } = await params  // ← DESEMBRULHAR com await
    const decodedUserIdentifier = decodeURIComponent(user_identifier)
    
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { id: decodedUserIdentifier },
          { username: decodedUserIdentifier }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        equippedProfileFrameId: true,
        followersCount: true,
        followingCount: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}