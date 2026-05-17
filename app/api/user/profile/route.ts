import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, username, bio, location, website, avatar } = body
    if (!name || name.trim() === '') {
    return NextResponse.json(
      { error: 'Nome é obrigatório' },
      { status: 400 }
    )
  }

  if (!username || username.trim() === '') {
    return NextResponse.json(
      { error: 'Username é obrigatório' },
      { status: 400 }
    )
  }
      const existingUser = await prisma.users.findFirst({
        where: {
          username,
          NOT: { id: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este username já está em uso' },
          { status: 400 }
        )
      }

      // Validar formato do username
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
      if (!usernameRegex.test(username)) {
        return NextResponse.json(
          { error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underscore' },
          { status: 400 }
        )
      }
    

    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: name,
        username: username,
        bio: bio || null,
        location: location || null,
        website: website || null,
        avatar: avatar || null,
        image: avatar || null, // manter compatibilidade
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        avatar: updatedUser.avatar,
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}