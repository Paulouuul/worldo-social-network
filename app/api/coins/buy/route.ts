import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // 1. Validação de Autenticação
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado ou e-mail ausente' }, { status: 401 });
    }

    // Validação de entrada
    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'O ID do pacote é obrigatório' }, { status: 400 });
    }

    // 2. Buscar o pacote
    const coinPackage = await prisma.coin_package.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    // 🔥 CORREÇÃO 1: Converter BigInt para Number
    const coinsNumber = Number(coinPackage.coins);
    const bonusCoinsNumber = Number(coinPackage.bonusCoins);
    const totalCoins = coinsNumber + bonusCoinsNumber;

    // 🔥 CORREÇÃO 2: Garantir precisão do preço
    const priceInReais = Number(coinPackage.priceReal);
    const priceInCents = Math.round(priceInReais * 100);

    // Validação de segurança
    if (priceInCents < 100) {
      return NextResponse.json({ error: 'Preço mínimo é R$1,00' }, { status: 400 });
    }

    // 3. Criar sessão no Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
