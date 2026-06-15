import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { syncToListing } from '@/lib/prisma-sync';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { listingId, priceCoins } = await request.json();

    if (!listingId || !priceCoins || priceCoins <= 0) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Buscar o anúncio
    const listing = await prisma.cosmetic_listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Você não é o dono deste anúncio' }, { status: 403 });
    }

    // Atualizar preço do anúncio
    const updatedListing = await prisma.cosmetic_listing.update({
      where: { id: listingId },
      data: { priceCoins },
    });

    // Atualizar o preço nos itens associados
    await prisma.user_frame_item.updateMany({
      where: { listingId: listingId },
      data: { resalePrice: priceCoins },
    });
    await syncToListing(listingId);
    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: `Preço atualizado para ${priceCoins} moedas por unidade!`,
    });
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    return NextResponse.json({ error: 'Erro ao atualizar preço' }, { status: 500 });
  }
}
