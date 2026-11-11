// app/api/worldo/coins/webhook/stripe/route.ts
// Rota /api/worldo/coins/webhook/stripe: webhook do Stripe que credita as moedas compradas quando
// o checkout é concluído.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/worldo/coins/webhook/stripe — valida a assinatura do Stripe e, em
 * checkout.session.completed, credita as moedas.
 *
 * Idempotente pelo stripeSessionId. Em uma única transação registra a coin_purchase, incrementa
 * o saldo e grava a coin_transaction com o saldo resultante. Erro de banco retorna 500 para o
 * Stripe reenviar; outros eventos são ignorados com 200.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Erro de assinatura no webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Apenas checkout concluído credita moedas
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, packageId, coins } = session.metadata || {};

    if (!userId || !coins || !packageId) {
      console.error('Metadados ausentes ou corrompidos na sessão:', session.metadata);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const coinsToCredit = BigInt(coins);
    if (coinsToCredit <= 0n) {
      return NextResponse.json({ error: 'Invalid coins amount' }, { status: 400 });
    }

    try {
      // Idempotência: sessão já processada não credita de novo
      const existingPurchase = await prisma.coin_purchase.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (existingPurchase) {
        // 200 faz o Stripe parar de reenviar o evento
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // Pacote comprado (preço registrado na compra)
      const coinPackage = await prisma.coin_package.findUnique({
        where: { id: packageId },
      });

      if (!coinPackage) {
        console.error('Pacote de moedas especificado não existe no banco:', packageId);
        return NextResponse.json({ error: 'Package not found' }, { status: 400 });
      }

      // Compra, saldo e histórico na mesma transação
      await prisma.$transaction(async (tx) => {
        // Registro da compra
        const coinPurchase = await tx.coin_purchase.create({
          data: {
            userId,
            packageId,
            amountCoins: coinsToCredit,
            priceReal: coinPackage.priceReal,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            status: 'PAID',
            paymentIntent: session as any,
          },
        });

        // Incremento atômico do saldo
        const updatedUser = await tx.users.update({
          where: { id: userId },
          data: { coins: { increment: coinsToCredit } },
          select: { coins: true },
        });

        // Histórico financeiro com o saldo resultante do incremento
        await tx.coin_transaction.create({
          data: {
            userId,
            amount: coinsToCredit,
            balance: updatedUser.coins,
            type: 'purchase',
            description: `Compra de ${coinsToCredit.toString()} moedas`,
            stripePaymentId: session.id,
            purchaseId: coinPurchase.id,
          },
        });
      });
    } catch (dbError) {
      console.error('Falha crítica ao persistir dados do pagamento no banco:', dbError);
      // 500 faz o Stripe reenviar o evento mais tarde
      return NextResponse.json({ error: 'Database transaction failed' }, { status: 500 });
    }
  }

  // Demais eventos (ex.: checkout.session.expired) são apenas confirmados
  return NextResponse.json({ received: true });
}
