// app/api/inventory/unequip/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar se o usuário tem algum item equipado
    const equippedItem = await prisma.user_frame_item.findFirst({
      where: {
        ownerId: userId,
        isEquipped: true,
      },
      include: {
        frame: true,
      },
    });

    if (!equippedItem) {
      return NextResponse.json({ error: 'Nenhum frame equipado no momento' }, { status: 404 });
    }

    // Usar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Desequipar o frame atual
      await tx.user_frame_item.updateMany({
        where: {
          ownerId: userId,
          isEquipped: true,
        },
        data: {
          isEquipped: false,
        },
      });

      // Remover do perfil do usuário
      await tx.users.update({
        where: {
          id: userId,
        },
        data: {
          equippedProfileFrameId: null,
        },
      });

      return equippedItem;
    });

    return NextResponse.json({
      success: true,
      message: `Frame "${result.frame.name}" desequipado com sucesso`,
      unequippedItem: {
        id: result.id,
        frameId: result.frameId,
        frameName: result.frame.name,
      },
    });
  } catch (error) {
    console.error('Erro ao desequipar cosmético:', error);
    return NextResponse.json({ error: 'Erro interno ao desequipar cosmético' }, { status: 500 });
  }
}
