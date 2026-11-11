// app/api/worldo/cosmetics/item/equip/route.ts
// Rota /api/worldo/cosmetics/item/equip: equipa uma moldura no perfil do usuário.

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/worldo/cosmetics/item/equip — equipa a unidade mais antiga não anunciada da moldura
 * { frameId }.
 *
 * Em transação: desequipa o item atual, equipa o novo e grava equippedProfileFrameId no
 * usuário. 404 se não houver unidade disponível.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { frameId } = await request.json();

    if (!frameId) {
      return NextResponse.json({ error: 'É necessário fornecer frameId' }, { status: 400 });
    }

    const userId = session.user.id;

    // Unidade mais antiga da moldura que não está à venda
    const itemToEquip = await prisma.user_frame_item.findFirst({
      where: {
        frameId: frameId,
        ownerId: userId,
        isListed: false,
      },
      include: {
        frame: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!itemToEquip) {
      return NextResponse.json(
        { error: 'Você não possui unidade deste item disponível para equipar' },
        { status: 404 },
      );
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

      // Equipa a nova unidade
      const updatedItem = await tx.user_frame_item.update({
        where: {
          id: itemToEquip.id,
        },
        data: {
          isEquipped: true,
        },
        include: {
          frame: true,
        },
      });

      // Moldura exibida no perfil
      await tx.users.update({
        where: {
          id: userId,
        },
        data: {
          equippedProfileFrameId: frameId,
        },
      });

      return updatedItem;
    });

    return NextResponse.json({
      success: true,
      message: 'Cosmético equipado com sucesso',
      item: result,
    });
  } catch (error) {
    console.error('Erro ao equipar cosmético:', error);
    return NextResponse.json({ error: 'Erro ao equipar cosmético' }, { status: 500 });
  }
}
