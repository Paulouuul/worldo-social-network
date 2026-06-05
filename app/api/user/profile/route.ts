import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { uploadPublic, deleteFile } from '@/lib/r2-upload';
import { convertToWebP } from '@/lib/image-converter';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
  const MAX_COVER_SIZE = 8 * 1024 * 1024;

  const MAX_AVATAR_GIF = 3 * 1024 * 1024;
  const MAX_COVER_GIF = 5 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];

  // Rastreamento estrito para reversão (Rollback) em caso de falha no banco
  let uploadedAvatarPath: string | null = null;
  let uploadedCoverPath: string | null = null;

  let newAvatarUrl: string | null | undefined = undefined;
  let newCoverImageUrl: string | null | undefined = undefined;
  let avatarToUpload: File | null = null;
  let coverToUpload: File | null = null;
  let shouldRemoveAvatar = false;
  let shouldRemoveCover = false;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let name: string;
    let username: string;
    let bio: string | null | undefined = undefined;
    let location: string | null | undefined = undefined;
    let website: string | null | undefined = undefined;

    // 1. Extração e Tratamento dos Dados
    if (isFormData) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      username = formData.get('username') as string;

      bio = formData.has('bio') ? (formData.get('bio') as string) || null : undefined;
      location = formData.has('location')
        ? (formData.get('location') as string) || null
        : undefined;
      website = formData.has('website') ? (formData.get('website') as string) || null : undefined;

      avatarToUpload = formData.get('avatar') as File | null;
      coverToUpload = formData.get('cover') as File | null;
      shouldRemoveAvatar = formData.get('removeAvatar') === 'true';
      shouldRemoveCover = formData.get('removeCover') === 'true';
    } else {
      const body = await request.json();
      name = body.name;
      username = body.username;

      bio = 'bio' in body ? body.bio || null : undefined;
      location = 'location' in body ? body.location || null : undefined;
      website = 'website' in body ? body.website || null : undefined;
    }

    // 2. Validações de Negócio de Entrada (Fail-Fast)
    if (!name?.trim() || !username?.trim()) {
      return NextResponse.json({ error: 'Nome e username são obrigatórios' }, { status: 400 });
    }

    const sanitizedUsername = username.toLowerCase().trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(sanitizedUsername)) {
      return NextResponse.json(
        {
          error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underscore',
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.users.findFirst({
      where: {
        username: sanitizedUsername,
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este username já está em uso' }, { status: 400 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { avatar: true, coverImage: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 3. Processar Operações do Cloudflare R2 primeiro
    // --- AVATAR ---
    if (avatarToUpload && avatarToUpload instanceof File && avatarToUpload.size > 0) {
      const extension = avatarToUpload.name.split('.').pop()?.toLowerCase();

      if (
        !ALLOWED_MIME_TYPES.includes(avatarToUpload.type) ||
        !extension ||
        !ALLOWED_EXTENSIONS.includes(extension)
      ) {
        return NextResponse.json(
          { error: 'Formato do avatar não suportado. Use JPG, PNG, GIF ou WEBP' },
          { status: 400 }
        );
      }

      if (avatarToUpload.type === 'image/gif' && avatarToUpload.size > MAX_AVATAR_GIF) {
        return NextResponse.json(
          {
            error: `GIF para avatar deve ter no máximo ${MAX_AVATAR_GIF / 1024 / 1024}MB.`,
          },
          { status: 400 }
        );
      }

      // Validação de tamanho normal
      if (avatarToUpload.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          {
            error: `Avatar deve ter no máximo ${MAX_AVATAR_SIZE / 1024 / 1024}MB.`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await avatarToUpload.arrayBuffer());
      const isGif = avatarToUpload.type === 'image/gif';

      const converted = await convertToWebP(buffer, avatarToUpload.type, {
        format: isGif ? 'webp-animated' : 'webp',
        quality: isGif ? 75 : 80,
        width: 512,
        height: 512,
        fit: 'cover',
      });

      // Criar novo arquivo otimizado
      const optimizedFile = new File(
        [new Uint8Array(converted.buffer)],
        `avatar-${Date.now()}.webp`,
        {
          type: 'image/webp',
        }
      );

      // Define o caminho e faz o upload
      uploadedAvatarPath = `avatars/${session.user.id}/avatar-${Date.now()}.webp`;
      newAvatarUrl = await uploadPublic(optimizedFile, uploadedAvatarPath);
    } else if (shouldRemoveAvatar) {
      newAvatarUrl = null;
    }

    // --- COVER ---
    if (coverToUpload && coverToUpload instanceof File && coverToUpload.size > 0) {
      const extension = coverToUpload.name.split('.').pop()?.toLowerCase();

      if (
        !ALLOWED_MIME_TYPES.includes(coverToUpload.type) ||
        !extension ||
        !ALLOWED_EXTENSIONS.includes(extension)
      ) {
        return NextResponse.json(
          { error: 'Formato do cover não suportado. Use JPG, PNG, GIF ou WEBP' },
          { status: 400 }
        );
      }

      // Validação específica para GIF
      if (coverToUpload.type === 'image/gif' && coverToUpload.size > MAX_COVER_GIF) {
        return NextResponse.json(
          {
            error: `GIF para banner deve ter no máximo ${MAX_COVER_GIF / 1024 / 1024}MB.`,
          },
          { status: 400 }
        );
      }

      // Validação de tamanho normal
      if (coverToUpload.size > MAX_COVER_SIZE) {
        return NextResponse.json(
          {
            error: `Cover deve ter no máximo ${MAX_COVER_SIZE / 1024 / 1024}MB.`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await coverToUpload.arrayBuffer());
      const isGif = coverToUpload.type === 'image/gif';

      const converted = await convertToWebP(buffer, coverToUpload.type, {
        format: isGif ? 'webp-animated' : 'webp',
        quality: isGif ? 75 : 80,
        width: 1920,
        height: 400,
      });

      // Criar novo arquivo otimizado
      const optimizedFile = new File(
        [new Uint8Array(converted.buffer)],
        `cover-${Date.now()}.webp`,
        {
          type: 'image/webp',
        }
      );

      uploadedCoverPath = `cover_image/${session.user.id}/cover_image-${Date.now()}.webp`;
      newCoverImageUrl = await uploadPublic(optimizedFile, uploadedCoverPath);
    } else if (shouldRemoveCover) {
      newCoverImageUrl = null;
    }

    // 4. Atualizar os Dados no Banco de Dados (Ponto de não retorno)
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        username: sanitizedUsername,
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(newAvatarUrl !== undefined && { avatar: newAvatarUrl }),
        ...(newCoverImageUrl !== undefined && { coverImage: newCoverImageUrl }),
      },
    });

    // Limpeza pós-sucesso (Arquivos Antigos)
    if (currentUser.avatar && (uploadedAvatarPath || shouldRemoveAvatar)) {
      const oldPath = currentUser.avatar.replace(`${process.env.R2_PUBLIC_URL}/`, '');
      await deleteFile(oldPath).catch((err) =>
        console.error('Aviso de Orfão: Falha ao deletar avatar antigo do R2:', err)
      );
    }

    if (currentUser.coverImage && (uploadedCoverPath || shouldRemoveCover)) {
      const oldPath = currentUser.coverImage.replace(`${process.env.R2_PUBLIC_URL}/`, '');
      await deleteFile(oldPath).catch((err) =>
        console.error('Aviso de Orfão: Falha ao deletar cover antigo do R2:', err)
      );
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
        coverImage: updatedUser.coverImage,
      },
    });
  } catch (error) {
    console.error('Erro crítico na atualização do perfil, iniciando rollback:', error);

    // ROLLBACK RESILIENTE: Se o Cloudflare aceitou os novos arquivos, mas a transação do banco falhou
    const rollbackPromises: Promise<void>[] = [];

    if (uploadedAvatarPath) {
      rollbackPromises.push(
        deleteFile(uploadedAvatarPath).catch((err) =>
          console.error(`Falha crítica no Rollback do Avatar (${uploadedAvatarPath}):`, err)
        )
      );
    }

    if (uploadedCoverPath) {
      rollbackPromises.push(
        deleteFile(uploadedCoverPath).catch((err) =>
          console.error(`Falha crítica no Rollback do Cover (${uploadedCoverPath}):`, err)
        )
      );
    }

    if (rollbackPromises.length > 0) {
      await Promise.all(rollbackPromises);
    }

    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
