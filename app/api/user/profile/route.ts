import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { uploadPublic, deleteFile } from '@/lib/r2-upload'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  let newAvatarUrl: string | null | undefined = undefined
  let fileToUpload: File | null = null
  let shouldRemoveAvatar = false

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let name: string
    let username: string
    let bio: string | null | undefined = undefined
    let location: string | null | undefined = undefined
    let website: string | null | undefined = undefined

    // 1. Extração e Tratamento dos Dados
    if (isFormData) {
      const formData = await request.formData()
      name = formData.get('name') as string
      username = formData.get('username') as string
      
      // Se o campo não foi enviado no FormData, mantemos undefined para não sobrescrever no banco
      bio = formData.has('bio') ? (formData.get('bio') as string || null) : undefined
      location = formData.has('location') ? (formData.get('location') as string || null) : undefined
      website = formData.has('website') ? (formData.get('website') as string || null) : undefined
      
      fileToUpload = formData.get('avatar') as File | null
      shouldRemoveAvatar = formData.get('removeAvatar') === 'true'
    } else {
      const body = await request.json()
      name = body.name
      username = body.username
      
      // Evita setar null caso a propriedade nem tenha sido enviada no JSON payload
      bio = 'bio' in body ? (body.bio || null) : undefined
      location = 'location' in body ? (body.location || null) : undefined
      website = 'website' in body ? (body.website || null) : undefined
    }

    // 2. Validações de Negócio de Entrada (Fail-Fast)
    if (!name?.trim() || !username?.trim()) {
      return NextResponse.json({ error: 'Nome e username são obrigatórios' }, { status: 400 })
    }

    const sanitizedUsername = username.toLowerCase().trim()
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(sanitizedUsername)) {
      return NextResponse.json({ 
        error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underscore' 
      }, { status: 400 })
    }

    // Verificar disponibilidade do username
    const existingUser = await prisma.users.findFirst({
      where: {
        username: sanitizedUsername,
        NOT: { id: session.user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este username já está em uso' }, { status: 400 })
    }

    // Buscar dados atuais do usuário para saber se precisaremos mexer em arquivos no R2
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { avatar: true }
    })

    // 3. Processar Uploads/Remoções de Arquivos APÓS todas as validações passarem
    if (fileToUpload && fileToUpload.size > 0) {
      const extension = fileToUpload.name.split('.').pop()
      const path = `avatars/${session.user.id}/avatar-${Date.now()}.${extension}`
      newAvatarUrl = await uploadPublic(fileToUpload, path)
    } else if (shouldRemoveAvatar) {
      newAvatarUrl = null
    }

    // 4. Atualizar os Dados no Banco de Dados
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        username: sanitizedUsername,
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(newAvatarUrl !== undefined && { avatar: newAvatarUrl }),
      }
    })

    // 5. Limpeza pós-sucesso: Se o banco atualizou e havia um avatar antigo, removemos ele do R2
    if (currentUser?.avatar && (fileToUpload?.size || shouldRemoveAvatar)) {
      try {
        const oldPath = currentUser.avatar.replace(`${process.env.R2_PUBLIC_URL}/`, '')
        await deleteFile(oldPath)
      } catch (deleteError) {
        // Logamos o erro mas não quebramos a requisição, pois o banco de dados já foi atualizado com sucesso
        console.error('Aviso: Falha ao deletar avatar antigo do R2:', deleteError)
      }
    }

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
    
    // Se fizemos o upload mas o banco falhou depois, apagamos o arquivo temporário upado
    if (newAvatarUrl) {
      const pathToDelete = newAvatarUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '')
      await deleteFile(pathToDelete).catch(console.error)
    }

    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}