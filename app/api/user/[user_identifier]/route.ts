import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

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

    // 1. Descodificar e normalizar a entrada
    const decodedUserIdentifier = decodeURIComponent(user_identifier).trim();
    const sanitizedIdentifier = decodedUserIdentifier.toLowerCase();

    // 2. Buscar no banco (Garantindo case-insensitive para o username)
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { publicId: decodedUserIdentifier }, // O ID original (mantém case original caso seja UUID/Cuid)
          { username: sanitizedIdentifier }, // O username normalizado em caixa baixa
        ],
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
