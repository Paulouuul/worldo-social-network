// app/api/worldo/me/route.ts
// Perfil do usuário logado.
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        publicId: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        password: true,
        equippedFrame: { select: { id: true, name: true, imageUrl: true, rarity: true } },
        accounts: { select: { provider: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { password, accounts, ...profile } = user;

    return NextResponse.json({
      ...profile,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      hasPassword: !!password,
      isOAuth: accounts.length > 0,
      provider: session.user.provider || accounts[0]?.provider || 'credentials',
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}
