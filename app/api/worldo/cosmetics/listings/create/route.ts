// app/api/worldo/cosmetics/listings/create/route.ts
// Rota /api/worldo/cosmetics/listings/create: coloca unidades de uma moldura do inventário à
// venda no marketplace.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { syncToListing } from '@/lib/search/prismaSync';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/worldo/cosmetics/listings/create — anuncia { frameId, quantity, priceCoins }.
 *
 * Usa apenas unidades livres (não anunciadas e não equipadas). Se o usuário já tem anúncio
 * ativo da moldura, soma a quantidade e aplica o novo preço a todas as unidades; senão cria o
 * anúncio. Marca as unidades como anunciadas e sincroniza o anúncio com o Elasticsearch na
 * mesma transação. Limites: preço e quantidade até 1.000.000.
 */
export async function POST(request: NextRequest) {
  try {
    const MAX_PRICE = 1000000;
    const MAX_QUANTITY = 1000000;
    console.log('[LISTING] Iniciando criação de anúncio...');

    const session = await auth();
    console.log('[LISTING] Session user ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('[LISTING] Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[LISTING] Dados recebidos:', body);

    const { frameId, quantity, priceCoins } = body;

    if (
      !frameId ||
      !quantity ||
      !priceCoins ||
      quantity <= 0 ||
      priceCoins <= 0 ||
      priceCoins > MAX_PRICE ||
      quantity > MAX_QUANTITY
    ) {
      console.log('[LISTING] Campos inválidos:', { frameId, quantity, priceCoins });
      return NextResponse.json({ error: 'Campos inválidos' }, { status: 400 });
    }

    console.log('[LISTING] Buscando frame:', frameId);
    const frame = await prisma.cosmetic_frame.findUnique({
      where: { id: frameId },
    });

    if (!frame) {
      console.log('[LISTING] Frame não encontrado:', frameId);
      return NextResponse.json({ error: 'Moldura não encontrada' }, { status: 404 });
    }
    console.log('[LISTING] Frame encontrado:', frame.name);

    // Unidades livres: não anunciadas e não equipadas
    console.log('[LISTING] Buscando itens do usuário...');
    const userItems = await prisma.user_frame_item.findMany({
      where: {
        ownerId: session.user.id,
        frameId: frameId,
        isListed: false,
        isEquipped: false,
      },
    });
    console.log(`[LISTING] Itens disponíveis: ${userItems.length}`);

    if (userItems.length < quantity) {
      console.log('[LISTING] Estoque insuficiente');
      return NextResponse.json(
        {
          error: `Você tem apenas ${userItems.length} unidades disponíveis para venda`,
        },
        { status: 400 },
      );
    }

    // Anúncio ativo existente do usuário para a mesma moldura
    console.log('[LISTING] Verificando anúncio existente para este frame...');
    const existingListing = await prisma.cosmetic_listing.findFirst({
      where: {
        frameId: frameId,
        sellerId: session.user.id,
        isActive: true,
      },
    });

    console.log('[LISTING] Iniciando transação...');
    const result = await prisma.$transaction(async (tx) => {
      let listing;

      if (existingListing) {
        // Soma ao anúncio existente
        console.log('[LISTING] Anúncio existente encontrado:', existingListing.id);
        console.log(
          `[LISTING] Quantidade atual: ${existingListing.quantity}, Adicionando: ${quantity}`,
        );

        listing = await tx.cosmetic_listing.update({
          where: { id: existingListing.id },
          data: {
            quantity: existingListing.quantity + quantity,
            priceCoins: priceCoins,
            updatedAt: new Date(),
          },
        });

        await tx.user_frame_item.updateMany({
          where: {
            listingId: existingListing.id,
          },
          data: {
            resalePrice: priceCoins, // Novo preço vale para todas as unidades do anúncio
          },
        });

        const itemsToUpdate = userItems.slice(0, quantity);
        await tx.user_frame_item.updateMany({
          where: { id: { in: itemsToUpdate.map((item) => item.id) } },
          data: {
            isListed: true,
            resalePrice: priceCoins,
            listingId: listing.id,
          },
        });
        await syncToListing(listing.id, tx);
        console.log('[LISTING] Anúncio atualizado:', listing.id);
      } else {
        // Novo anúncio
        console.log('[LISTING] Criando novo anúncio...');
        listing = await tx.cosmetic_listing.create({
          data: {
            frameId,
            sellerId: session.user.id,
            quantity,
            priceCoins,
            isActive: true,
          },
        });
        console.log('[LISTING] Novo anúncio criado:', listing.id);

        // Marca as unidades como anunciadas
        const itemsToUpdate = userItems.slice(0, quantity);
        console.log(`[LISTING] Marcando ${itemsToUpdate.length} itens como listados...`);

        await tx.user_frame_item.updateMany({
          where: {
            id: { in: itemsToUpdate.map((item) => item.id) },
          },
          data: {
            isListed: true,
            resalePrice: priceCoins,
            listingId: listing.id,
          },
        });
        await syncToListing(listing.id, tx);
        console.log('[LISTING] Itens atualizados');
      }

      return { listing, isNew: !existingListing };
    });

    const mensagem = result.isNew
      ? `${quantity} unidade(s) colocadas à venda por ${priceCoins} moedas cada!`
      : `${quantity} unidade(s) adicionadas ao anúncio existente! Total: ${result.listing.quantity} unidades`;

    console.log('[LISTING] Operação concluída com sucesso!', mensagem);
    return NextResponse.json(
      {
        success: true,
        listing: result.listing,
        isNewListing: result.isNew,
        message: mensagem,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[LISTING] Erro detalhado:', error);
    console.error('[LISTING] Stack trace:', error.stack);
    return NextResponse.json(
      {
        error: 'Erro ao criar anúncio',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
