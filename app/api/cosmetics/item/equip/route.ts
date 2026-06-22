// app/api/inventory/equip/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { frameId } = await request.json();

    if (!frameId) {
      return NextResponse.json(
        { error: 'É necessário fornecer frameId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Buscar o primeiro item do frame que o usuário possui e não está listado
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
        createdAt: 'asc', // Pega o mais antigo primeiro
      },
    });

    // Verificar se o usuário possui pelo menos 1 item disponível
    if (!itemToEquip) {

      return NextResponse.json(
        { error: 'Você não possui unidade deste item disponível para equipar' },
        { status: 404 }
      );
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

      // Equipar o novo frame
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

      // Atualizar o perfil do usuário com o frame equipado
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
    return NextResponse.json(
      { error: 'Erro ao equipar cosmético' },
      { status: 500 }
    );
  }
}