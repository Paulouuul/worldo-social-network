import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { uploadPublic, deleteFile } from '@/lib/r2-upload'
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

    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let name: string
    let username: string
    let bio: string | null = null
    let location: string | null = null
    let website: string | null = null
    let avatarUrl: string | null |  undefined = undefined

    if (isFormData) {
      // ========== VIA FORM DATA (COM UPLOAD) ==========
      const formData = await request.formData()
      name = formData.get('name') as string
      username = formData.get('username') as string
      bio = formData.get('bio') as string || null
      location = formData.get('location') as string || null
      website = formData.get('website') as string || null
      const avatarFile = formData.get('avatar') as File | null
      const removeAvatar = formData.get('removeAvatar') === 'true'

      // Upload do avatar se houver arquivo
      if (avatarFile && avatarFile.size > 0) {
        const extension = avatarFile.name.split('.').pop()
        const path = `avatars/${session.user.id}/avatar-${Date.now()}.${extension}`

        const userAtual = await prisma.users.findUnique({
          where: { id: session.user.id },
          select: { avatar: true }
        })

        if (userAtual?.avatar ) {
          const oldPath = userAtual.avatar.replace(`${process.env.R2_PUBLIC_URL}/`, '')
          await deleteFile(oldPath)
        }

        avatarUrl = await uploadPublic(avatarFile, path)
      }else if (removeAvatar) {
        const userAtual = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { avatar: true }
        })
    
        if (userAtual?.avatar) {
          const oldPath = userAtual.avatar.replace(`${process.env.R2_PUBLIC_URL}/`, '')
          await deleteFile(oldPath)
          avatarUrl = null // Define como null para remover do banco
        }
      }
    } else {
      // ========== VIA JSON (SEM UPLOAD) ==========
      const body = await request.json()
      name = body.name
      username = body.username
      bio = body.bio || null
      location = body.location || null
      website = body.website || null
    }

    // Validações
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, 
      { status: 400 })
    }

    if (!username?.trim()) {
      return NextResponse.json({ error: 'Username é obrigatório' }, 
      { status: 400 })
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underscore' },
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

    // Atualizar usuário
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name,
        username,
        bio,
        location,
        website,
        avatar: avatarUrl,
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