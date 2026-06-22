import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { syncToListing } from '@/lib/prisma-sync';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    console.log('[UPDATE PRICE] Iniciando atualização de preço...');

    const session = await auth();
    if (!session?.user?.id) {
      console.log('[UPDATE PRICE] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[UPDATE PRICE] Usuário autenticado:', session.user.id);

    const { listingId, priceCoins } = await request.json();
    console.log('[UPDATE PRICE] Dados recebidos:', { listingId, priceCoins });

    if (!listingId || !priceCoins || priceCoins <= 0) {
      console.log('[UPDATE PRICE] Campos inválidos');
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Buscar o anúncio
    console.log('[UPDATE PRICE] Buscando listing...');
    const listing = await prisma.cosmetic_listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      console.log('[UPDATE PRICE] Listing não encontrado:', listingId);
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }

    console.log('[UPDATE PRICE] Listing encontrado:', {
      id: listing.id,
      sellerId: listing.sellerId,
      currentPrice: listing.priceCoins,
      newPrice: priceCoins,
    });

    if (listing.sellerId !== session.user.id) {
      console.log('[UPDATE PRICE] Usuário não é dono');
      return NextResponse.json({ error: 'Você não é o dono deste anúncio' }, { status: 403 });
    }

    console.log('[UPDATE PRICE] Iniciando transação PostgreSQL...');

    const updatedListing = await prisma.$transaction(async (tx) => {
      // Atualizar preço do anúncio
      console.log('[UPDATE PRICE] Atualizando preço do listing...');
      const updated = await tx.cosmetic_listing.update({
        where: { id: listingId },
        data: {
          priceCoins,
          updatedAt: new Date(),
        },
      });
      console.log('[UPDATE PRICE] Listing atualizado:', updated.id);

      // Atualizar o preço nos itens associados
      console.log('[UPDATE PRICE] Atualizando preço dos itens...');
      const updateResult = await tx.user_frame_item.updateMany({
        where: { listingId: listingId },
        data: { resalePrice: priceCoins },
      });
      console.log(`[UPDATE PRICE] ${updateResult.count} itens atualizados`);

      return updated;
    });

    console.log('[UPDATE PRICE] Transação PostgreSQL concluída');

    try {
      console.log('[UPDATE PRICE] Sincronizando com Elasticsearch...');
      await syncToListing(listingId);
      console.log('[UPDATE PRICE] Sincronizado com Elasticsearch com sucesso');
    } catch (esError) {
      console.error('[UPDATE PRICE] ERRO ao sincronizar com Elasticsearch:', esError);
    }

    console.log('[UPDATE PRICE] Operação concluída com sucesso');

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: `Preço atualizado para ${priceCoins} moedas por unidade!`,
    });
  } catch (error) {
    console.error('[UPDATE PRICE] Erro crítico:', error);
    if (error instanceof Error) {
      console.error('[UPDATE PRICE] Mensagem:', error.message);
      console.error('[UPDATE PRICE] Stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Erro ao atualizar preço',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
