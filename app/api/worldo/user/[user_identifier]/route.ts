// app/api/worldo/user/[user_identifier]/route.ts
// Rota /api/worldo/user/[user_identifier]: perfil público de um usuário.

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/worldo/user/:publicIdOuUsername — perfil público (nome, bio, avatar, capa, local,
 * site, moldura equipada e contadores). Username é comparado em minúsculas.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_identifier: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { user_identifier } = await params;

    // Decodifica e normaliza o identificador
    const decodedUserIdentifier = decodeURIComponent(user_identifier).trim();
    const sanitizedIdentifier = decodedUserIdentifier.toLowerCase();

    // Busca por publicId (exato) ou username (minúsculo)
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ publicId: decodedUserIdentifier }, { username: sanitizedIdentifier }],
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        equippedProfileFrameId: true,
        followersCount: true,
        followingCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}
