import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[REMOVE] Iniciando remoção de listing...');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[REMOVE] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[REMOVE] Usuário autenticado:', session.user.id);

    const body = await request.json();
    console.log('[REMOVE] Body recebido:', JSON.stringify(body, null, 2));

    const { listingId, quantity } = body;

    console.log('[REMOVE] listingId:', listingId, '| Tipo:', typeof listingId);
    console.log('[REMOVE] quantity:', quantity, '| Tipo:', typeof quantity);

    if (!listingId || !quantity || quantity <= 0) {
      console.log('[REMOVE] Campos inválidos:', {
        listingIdPresent: !!listingId,
        quantityPresent: !!quantity,
        quantityValue: quantity,
      });
      return NextResponse.json(
        {
          error: 'Campos obrigatórios faltando',
          details: {
            listingId: listingId || 'ausente',
            quantity: quantity || 'ausente',
          },
        },
        { status: 400 }
      );
    }

    // Buscar o anúncio
    console.log('[REMOVE] Buscando listing no banco...');
    const listing = await prisma.cosmetic_listing.findUnique({
      where: { id: listingId },
      include: { frame: true },
    });

    if (!listing) {
      console.log('[REMOVE] Listing não encontrado:', listingId);
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }

    console.log('[REMOVE] Listing encontrado:', {
      id: listing.id,
      sellerId: listing.sellerId,
      quantity: listing.quantity,
      frameName: listing.frame.name,
    });

    if (listing.sellerId !== session.user.id) {
      console.log('[REMOVE] Usuário não é dono:', {
        userId: session.user.id,
        sellerId: listing.sellerId,
      });
      return NextResponse.json({ error: 'Você não é o dono deste anúncio' }, { status: 403 });
    }

    if (quantity > listing.quantity) {
      console.log('[REMOVE] Quantidade maior que disponível:', {
        solicitado: quantity,
        disponivel: listing.quantity,
      });
      return NextResponse.json(
        {
          error: `Você só tem ${listing.quantity} unidades neste anúncio`,
        },
        { status: 400 }
      );
    }

    console.log('[REMOVE] Iniciando transação...');

    // Remover do mercado
    const result = await prisma.$transaction(async (tx) => {
      console.log('[REMOVE] Buscando itens listados...');

      // Buscar itens listados deste anúncio
      const listedItems = await tx.user_frame_item.findMany({
        where: {
          listingId: listingId,
          isListed: true,
        },
        take: quantity,
      });

      console.log('[REMOVE] Itens encontrados:', {
        quantidade: listedItems.length,
        ids: listedItems.map((item) => item.id),
      });

      if (listedItems.length === 0) {
        console.log('[REMOVE] Nenhum item encontrado para remover');
        throw new Error('Nenhum item encontrado para remover');
      }

      // Desmarcar os itens como listados
      console.log('[REMOVE] Atualizando itens para não listados...');
      const updateResult = await tx.user_frame_item.updateMany({
        where: {
          id: { in: listedItems.map((item) => item.id) },
        },
        data: {
          isListed: false,
          resalePrice: null,
          listingId: null,
        },
      });

      console.log('[REMOVE] Itens atualizados:', updateResult.count);

      // Atualizar ou deletar o listing
      const newQuantity = listing.quantity - quantity;
      console.log('[REMOVE] Nova quantidade:', newQuantity);

      if (newQuantity <= 0) {
        // Se não tem mais unidades, deletar o anúncio
        console.log('[REMOVE] Deletando listing (quantidade zerada)...');
        await tx.cosmetic_listing.delete({
          where: { id: listingId },
        });
        console.log('[REMOVE] Listing deletado');
        return { deleted: true, remainingQuantity: 0 };
      } else {
        // Atualizar a quantidade do anúncio
        console.log('[REMOVE] Atualizando quantidade do listing...');
        await tx.cosmetic_listing.update({
          where: { id: listingId },
          data: { quantity: newQuantity },
        });
        console.log('[REMOVE] Listing atualizado');
        return { deleted: false, remainingQuantity: newQuantity };
      }
    });

    console.log('[REMOVE] Operação concluída com sucesso:', result);

    return NextResponse.json({
      success: true,
      ...result,
      message: `${quantity} unidade(s) removidas do mercado${result.deleted ? ' (anúncio encerrado)' : ''}`,
    });
  } catch (error) {
    console.error('[REMOVE] Erro crítico:', error);

    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('[REMOVE] Mensagem:', error.message);
      console.error('[REMOVE] Stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Erro ao remover do mercado',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
