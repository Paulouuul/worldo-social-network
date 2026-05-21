import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // 1. Validação de Autenticação (Precisa do ID e do Email para o Stripe)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado ou e-mail ausente' },
        { status: 401 }
      )
    }

    // Validação de entrada básica (Fail Fast)
    const body = await request.json().catch(() => ({}))
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'O ID do pacote é obrigatório' },
        { status: 400 }
      )
    }
    
    // 2. Buscar o pacote no banco de dados
    const coinPackage = await prisma.coin_package.findUnique({
      where: { id: packageId }
    })

    if (!coinPackage) {
      return NextResponse.json(
        { error: 'Pacote não encontrado' },
        { status: 404 }
      )
    }

    // Calcular o total de moedas que serão entregues no webhook posterior
    const totalCoins = coinPackage.coins + coinPackage.bonusCoins

    // 3. Criar sessão de checkout no Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Você pode adicionar 'pix' aqui futuramente se sua conta Stripe for BR
      customer_email: session.user.email, // Pré-preenche o e-mail no formulário do Stripe
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: coinPackage.name,
              description: `${coinPackage.coins} moedas${coinPackage.bonusCoins > 0 ? ` + ${coinPackage.bonusCoins} bônus` : ''}`,
            },
            unit_amount: Math.round(coinPackage.priceReal * 100), // Converte centavos corretamente
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coins/cancel`,
      metadata: {
        userId: session.user.id,
        packageId: packageId,
        // CRÍTICO: Stripe exige que todos os valores de metadata sejam estritamente STRINGS
        coins: String(totalCoins), 
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao processar compra' },
      { status: 500 }
    )
  }
}