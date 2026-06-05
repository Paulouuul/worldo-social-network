import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    if (!frameId || !quantity || !priceCoins || quantity <= 0 || priceCoins <= 0) {
      console.log('[LISTING] Campos inválidos:', { frameId, quantity, priceCoins });
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Buscar o frame primeiro
    console.log('[LISTING] Buscando frame:', frameId);
    const frame = await prisma.cosmetic_frame.findUnique({
      where: { id: frameId },
    });

    if (!frame) {
      console.log('[LISTING] Frame não encontrado:', frameId);
      return NextResponse.json({ error: 'Moldura não encontrada' }, { status: 404 });
    }
    console.log('[LISTING] Frame encontrado:', frame.name);

    // Verificar se o usuário tem este frame no inventário (não listados)
    console.log('[LISTING] Buscando itens do usuário...');
    const userItems = await prisma.user_frame_item.findMany({
      where: {
        ownerId: session.user.id,
        frameId: frameId,
        isListed: false,
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

    // 🔥 NOVA LÓGICA: Verificar se já existe um anúncio ativo para este frame
    console.log('[LISTING] Verificando anúncio existente para este frame...');
    const existingListing = await prisma.cosmetic_listing.findFirst({
      where: {
        frameId: frameId,
        sellerId: session.user.id,
        isActive: true,
      },
    });

    // Criar ou atualizar o anúncio
    console.log('[LISTING] Iniciando transação...');
    const result = await prisma.$transaction(async (tx) => {
      let listing;

      if (existingListing) {
        // 🔥 ATUALIZAR ANÚNCIO EXISTENTE
        console.log('[LISTING] Anúncio existente encontrado:', existingListing.id);
        console.log(
          `[LISTING] Quantidade atual: ${existingListing.quantity}, Adicionando: ${quantity}`,
        );

        // Atualizar a quantidade do anúncio existente
        listing = await tx.cosmetic_listing.update({
          where: { id: existingListing.id },
          data: {
            quantity: existingListing.quantity + quantity,
            priceCoins: priceCoins, // Opcional: atualiza o preço ou mantém o antigo?
            updatedAt: new Date(),
          },
        });
        console.log('[LISTING] Anúncio atualizado:', listing.id);
      } else {
        // 🔥 CRIAR NOVO ANÚNCIO
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
      }

      // Marcar os itens como listados (usando o listingId correto)
      const itemsToUpdate = userItems.slice(0, quantity);
      console.log(`[LISTING] Marcando ${itemsToUpdate.length} itens como listados...`);

      await tx.user_frame_item.updateMany({
        where: {
          id: { in: itemsToUpdate.map((item) => item.id) },
        },
        data: {
          isListed: true,
          resalePrice: priceCoins,
          listingId: listing.id, // Usa o ID do anúncio (novo ou existente)
        },
      });
      console.log('[LISTING] Itens atualizados');

      return { listing, isNew: !existingListing };
    });

    const mensagem = result.isNew
      ? `${quantity} unidade(s) colocadas à venda por ${priceCoins} moedas cada!`
      : `${quantity} unidade(s) adicionadas ao anúncio existente! Total: ${result.listing.quantity} unidades`;

    console.log('🎉 [LISTING] Operação concluída com sucesso!', mensagem);
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
