// app/api/worldo/coins/buy/route.ts
// Rota /api/worldo/coins/buy: inicia a compra de um pacote de moedas criando uma sessão de
// checkout do Stripe.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/worldo/coins/buy — cria a sessão de checkout do Stripe para o pacote informado e
 * retorna { url } de pagamento.
 *
 * O total de moedas (base + bônus) e o id do usuário seguem nos metadados para o webhook
 * creditar após o pagamento. Preço mínimo: R$ 1,00.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Exige sessão com email (usado no checkout do Stripe)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado ou e-mail ausente' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'O ID do pacote é obrigatório' }, { status: 400 });
    }

    // Pacote escolhido
    const coinPackage = await prisma.coin_package.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    // Moedas são BigInt no banco
    const coinsNumber = Number(coinPackage.coins);
    const bonusCoinsNumber = Number(coinPackage.bonusCoins);
    const totalCoins = coinsNumber + bonusCoinsNumber;

    // Preço em centavos (inteiro) para o Stripe
    const priceInReais = Number(coinPackage.priceReal);
    const priceInCents = Math.round(priceInReais * 100);

    if (priceInCents < 100) {
      return NextResponse.json({ error: 'Preço mínimo é R$1,00' }, { status: 400 });
    }

    // Sessão de checkout do Stripe com os metadados usados pelo webhook
    const stripeSession = await stripe.checkout.sessions.create({
      allowed_payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: coinPackage.name,
              description: `${coinsNumber} moedas${bonusCoinsNumber > 0 ? ` + ${bonusCoinsNumber} bônus` : ''}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/worldo/coins/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/worldo/coins/cancel`,
      metadata: {
        userId: session.user.id,
        packageId: packageId,
        coins: String(totalCoins),
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json({ error: 'Erro ao processar compra' }, { status: 500 });
  }
}
