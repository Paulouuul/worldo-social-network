// app/api/cosmetics/marketplace/checkout/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { backendApiCall } from '@/lib/backendApiClient';
import { syncToListing } from '@/lib/prisma-sync';

interface CheckoutItem {
  listing_id: string;
  quantity: number;
  price: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  total_price: number;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Validação do body
    const body: CheckoutRequest = await request.json();
    const { items, total_price } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item para comprar' }, { status: 400 });
    }

    // 3. Busca todos os listings em uma única query
    const listingIds = items.map((item) => item.listing_id);
    const listings = await prisma.cosmetic_listing.findMany({
      where: {
        id: { in: listingIds },
        isActive: true,
      },
      include: {
        frame: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // 4. Validação dos itens
    const validationErrors: string[] = [];
    const validatedItems: {
      listing: any;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const listing = listings.find((l) => l.id === item.listing_id);

      if (!listing) {
        validationErrors.push(`Anúncio não encontrado: ${item.listing_id}`);
        continue;
      }

      if (listing.priceCoins !== item.price) {
        validationErrors.push(
          `Preço do item "${listing.frame.name}" alterado. Esperado: ${listing.priceCoins}, Recebido: ${item.price}`,
        );
        continue;
      }

      if (listing.quantity < item.quantity) {
        validationErrors.push(
          `Estoque insuficiente para "${listing.frame.name}". Disponível: ${listing.quantity}, Solicitado: ${item.quantity}`,
        );
        continue;
      }

      if (listing.sellerId === userId) {
        validationErrors.push(`Você não pode comprar seu próprio anúncio: "${listing.frame.name}"`);
        continue;
      }

      validatedItems.push({
        listing,
        quantity: item.quantity,
        price: item.price,
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Erro ao validar itens',
          error_type: 'validation_error',
          errors: validationErrors,
        },
        { status: 400 },
      );
    }

    // 5. Calcula o total real
    const realTotal = validatedItems.reduce(
      (sum, item) => sum + item.listing.priceCoins * item.quantity,
      0,
    );

    if (realTotal !== total_price) {
      return NextResponse.json(
        {
          error: 'Total da compra não confere',
          error_type: 'price_mismatch',
          expected: realTotal,
          received: total_price,
        },
        { status: 400 },
      );
    }

    // 6. Verifica saldo do usuário
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { coins: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.coins < realTotal) {
      return NextResponse.json(
        {
          error: 'Saldo insuficiente',
          error_type: 'insufficient_balance',
          balance: user.coins,
          needed: realTotal,
          missing: realTotal - user.coins,
        },
        { status: 400 },
      );
    }
    const activeFee = await prisma.platform_fee.findFirst({
      where: { isActive: true },
    });
    // 7. Processa a compra em transação
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 7.1 Debitar moedas do comprador
        const updatedBuyer = await tx.users.update({
          where: { id: userId },
          data: { coins: { decrement: realTotal } },
        });

        const purchases = [];
        const feePercentage = activeFee?.feeValue ?? 5.0;
        const platformFee = Math.floor(realTotal * (feePercentage / 100));
        const totalSellerEarnings = realTotal - platformFee;

        for (const validated of validatedItems) {
          const { listing, quantity } = validated;

          // 7.2 Buscar itens disponíveis do vendedor
          const sellerItems = await tx.user_frame_item.findMany({
            where: {
              frameId: listing.frameId,
              ownerId: listing.sellerId,
              isListed: true,
              isEquipped: false,
              listingId: listing.id,
            },
            take: quantity,
          });

          if (sellerItems.length < quantity) {
            throw new Error(`Itens insuficientes do vendedor para ${listing.frame.name}`);
          }

          // 7.3 Criar compra
          const itemTotal = listing.priceCoins * quantity;
          const itemPlatformFee = Math.floor(itemTotal * (feePercentage / 100));
          const itemSellerEarnings = itemTotal - itemPlatformFee;

          const purchase = await tx.cosmetic_purchase.create({
            data: {
              frameId: listing.frameId,
              buyerId: userId,
              sellerId: listing.sellerId,
              quantity: quantity,
              pricePaid: listing.priceCoins,
              platformFee: itemPlatformFee,
              sellerEarnings: itemSellerEarnings,
            },
          });

          // 7.4 Transferir itens para o comprador
          await tx.user_frame_item.updateMany({
            where: {
              id: { in: sellerItems.map((item) => item.id) },
            },
            data: {
              ownerId: userId,
              isListed: false,
              listingId: null,
              resalePrice: null,
              purchaseId: purchase.id,
              soldAt: new Date(),
              soldTo: userId,
            },
          });

          // 7.5 Atualizar estoque do listing
          await tx.cosmetic_listing.update({
            where: { id: listing.id },
            data: {
              quantity: { decrement: quantity },
            },
          });

          try {
            await syncToListing(listing.id, tx);
            console.log(`[CHECKOUT] Listing ${listing.id} sincronizado com ElasticSearch`);
          } catch (esError) {
            console.warn('[CHECKOUT] Erro ao sincronizar com ElasticSearch:', esError);
          }

          // 7.6 Atualizar estatísticas da moldura
          await tx.cosmetic_frame.update({
            where: { id: listing.frameId },
            data: {
              soldCount: { increment: quantity },
              totalSales: { increment: quantity },
            },
          });

          // 7.7 Creditar moedas para o vendedor
          await tx.users.update({
            where: { id: listing.sellerId },
            data: { coins: { increment: itemSellerEarnings } },
          });

          // 7.8 Buscar saldo atual do vendedor para registrar
          const sellerAfterBalance = await tx.users.findUnique({
            where: { id: listing.sellerId },
            select: { coins: true },
          });

          // 7.9 Registrar transação do vendedor
          await tx.coin_transaction.create({
            data: {
              userId: listing.sellerId,
              amount: itemSellerEarnings,
              balance: sellerAfterBalance?.coins || 0,
              type: 'earn',
              description: `Venda de ${quantity}x ${listing.frame.name} para ${updatedBuyer.name}`,
              metadata: {
                buyer_id: userId,
                purchase_id: purchase.id,
                listing_id: listing.id,
                platform_fee: itemPlatformFee,
              },
            },
          });

          purchases.push(purchase);
        }

        // 7.10 Registrar transação do comprador
        await tx.coin_transaction.create({
          data: {
            userId: userId,
            amount: -realTotal,
            balance: updatedBuyer.coins,
            type: 'spend',
            description: `Compra de ${validatedItems.length} itens no marketplace`,
            metadata: {
              items: validatedItems.map((v) => ({
                name: v.listing.frame.name,
                quantity: v.quantity,
                price: v.listing.priceCoins,
              })),
              total: realTotal,
              platform_fee: platformFee,
            },
          },
        });

        // 7.11 Sincronizar listings com Redis (atualizar estoque)
        // 7.11 Sincronizar listings com Redis
        try {
          await backendApiCall('/cosmetics/marketplace/cart/sync', {
            method: 'DELETE',
          });
        } catch (syncError) {
          console.warn('[CHECKOUT] Erro ao sincronizar:', syncError);
        }

        // 7.12 Limpar carrinho do Redis
        try {
          const clearResponse = await backendApiCall('/cosmetics/marketplace/cart/clear', {
            method: 'DELETE',
          });

          if (!clearResponse.ok) {
            console.warn('[CHECKOUT] Não foi possível limpar carrinho');
          }
        } catch (clearError) {
          console.warn('[CHECKOUT] Erro ao limpar carrinho:', clearError);
        }

        return {
          purchases,
          total: realTotal,
          platformFee,
          totalSellerEarnings,
          newBalance: updatedBuyer.coins,
        };
      });

      // 8. Retorna sucesso
      return NextResponse.json(
        {
          success: true,
          message: 'Compra realizada com sucesso!',
          data: {
            order_id: result.purchases[0]?.id || 'unknown',
            total: result.total,
            platform_fee: result.platformFee,
            seller_earnings: result.totalSellerEarnings,
            new_balance: result.newBalance,
            items: validatedItems.map((v) => ({
              name: v.listing.frame.name,
              quantity: v.quantity,
              price: v.listing.priceCoins,
            })),
          },
        },
        { status: 200 },
      );
    } catch (error: any) {
      console.error('[CHECKOUT] Erro na transação:', error);
      return NextResponse.json(
        {
          error: 'Erro ao processar compra',
          error_type: 'transaction_error',
          details: error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('[CHECKOUT] Erro geral:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao processar compra',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
