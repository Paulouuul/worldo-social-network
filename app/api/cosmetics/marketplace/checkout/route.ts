// app/api/cosmetics/marketplace/checkout/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { serverTokenManager } from '@/lib/serverBackendTokenManager';
import { backendApiServerCall } from '@/lib/backendApiClient';
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    const body: CheckoutRequest = await request.json();
    const { items, total_price } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item para comprar' }, { status: 400 });
    }

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

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { coins: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userCoinsNumber = Number(user.coins);
    if (userCoinsNumber < realTotal) {
      return NextResponse.json(
        {
          error: 'Saldo insuficiente',
          error_type: 'insufficient_balance',
          balance: userCoinsNumber,
          needed: realTotal,
          missing: realTotal - userCoinsNumber,
        },
        { status: 400 },
      );
    }

    const activeFee = await prisma.platform_fee.findFirst({
      where: { isActive: true },
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const updatedBuyer = await tx.users.update({
          where: { id: userId },
          data: { coins: { decrement: realTotal } },
        });

        const purchases = [];
        const feePercentage = activeFee?.feeValue ?? 5;
        const platformFee = Math.max(1, Math.floor(realTotal * (feePercentage / 100)));
        const totalSellerEarnings = realTotal - platformFee;

        for (const validated of validatedItems) {
          const { listing, quantity } = validated;

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

          await tx.cosmetic_frame.update({
            where: { id: listing.frameId },
            data: {
              soldCount: { increment: quantity },
              totalSales: { increment: quantity },
            },
          });

          await tx.users.update({
            where: { id: listing.sellerId },
            data: { coins: { increment: itemSellerEarnings } },
          });

          const sellerAfterBalance = await tx.users.findUnique({
            where: { id: listing.sellerId },
            select: { coins: true },
          });

          await tx.coin_transaction.create({
            data: {
              userId: listing.sellerId,
              amount: itemSellerEarnings,
              balance: Number(sellerAfterBalance?.coins || 0),
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

        await tx.coin_transaction.create({
          data: {
            userId: userId,
            amount: -realTotal,
            balance: Number(updatedBuyer.coins),
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
        const token = await serverTokenManager.getToken();
        try {
          await backendApiServerCall(
            '/cosmetics/marketplace/cart/sync',
            {
              method: 'DELETE',
            },
            token,
          );
        } catch (syncError) {
          console.warn('[CHECKOUT] Erro ao sincronizar:', syncError);
        }

        try {
          const clearResponse = await backendApiServerCall(
            '/cosmetics/marketplace/cart/clear',
            {
              method: 'DELETE',
            },
            token,
          );

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
          newBalance: Number(updatedBuyer.coins),
        };
      });

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
