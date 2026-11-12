// app/api/worldo/cosmetics/item/unequip/route.ts
// Rota /api/worldo/cosmetics/item/unequip: remove a moldura equipada do perfil do usuário.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

/**
 * POST /api/worldo/cosmetics/item/unequip — desequipa o item atual e limpa
 * equippedProfileFrameId, em transação. 404 se nada estiver equipado.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

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

    const result = await prisma.$transaction(async (tx) => {
      // Desequipa o item atual
      await tx.user_frame_item.updateMany({
        where: {
          ownerId: userId,
          isEquipped: true,
        },
        data: {
          isEquipped: false,
        },
      });

      // Remove a moldura do perfil
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
