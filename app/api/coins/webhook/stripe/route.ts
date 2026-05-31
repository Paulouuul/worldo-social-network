import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Erro de assinatura no webhook:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Processa apenas o evento de checkout finalizado com sucesso
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, packageId, coins } = session.metadata || {}

    if (!userId || !coins || !packageId) {
      console.error('Metadados ausentes ou corrompidos na sessão:', session.metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const coinsToCredit = parseInt(coins)
    if (isNaN(coinsToCredit) || coinsToCredit <= 0) {
      return NextResponse.json({ error: 'Invalid coins amount' }, { status: 400 })
    }

    try {
      // 1. DEFESA DE IDEMPOTÊNCIA: Verifica se este pagamento já foi processado antes
      const existingPurchase = await prisma.coin_purchase.findFirst({
        where: { stripeSessionId: session.id }
      })

      if (existingPurchase) {
        // console.log(`Evento duplicado ignorado. Sessão do Stripe já processada: ${session.id}`)
        // Retorna status 200 para o Stripe parar de reenviar este mesmo evento
        return NextResponse.json({ received: true, message: 'Already processed' })
      }

      // 2. Buscar o pacote de moedas para auditar o preço histórico
      const coinPackage = await prisma.coin_package.findUnique({
        where: { id: packageId }
      })

      if (!coinPackage) {
        console.error('Pacote de moedas especificado não existe no banco:', packageId)
        return NextResponse.json({ error: 'Package not found' }, { status: 400 })
      }

      // 3. Execução Atômica Completa (Transação Interativa)
      await prisma.$transaction(async (tx) => {
        // A) Salva o registro da compra do pacote
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
          }
        })

        // B) Incrementa o saldo diretamente no banco e captura os dados atualizados do usuário
        const updatedUser = await tx.users.update({
          where: { id: userId },
          data: { coins: { increment: coinsToCredit } },
          select: { coins: true }
        })

        // C) Cria o histórico log financeiro utilizando o saldo em tempo real retornado pelo banco (Sem Race Conditions)
        await tx.coin_transaction.create({
          data: {
            userId,
            amount: coinsToCredit,
            balance: updatedUser.coins, // Saldo preciso gerado no passo B
            type: 'purchase',
            description: `Compra de ${coinsToCredit} moedas`,
            stripePaymentId: session.id,
            purchaseId: coinPurchase.id,
          }
        })
      })

      // console.log(`Sucesso! ${coinsToCredit} moedas creditadas para o usuário ${userId}`)

    } catch (dbError) {
      console.error('Falha crítica ao persistir dados do pagamento no banco:', dbError)
      // Retorna 500 para que o Stripe guarde o evento na fila e tente enviá-lo novamente mais tarde
      return NextResponse.json({ error: 'Database transaction failed' }, { status: 500 })
    }
  }

  // Retorna sucesso para qualquer outro tipo de evento que você não queira processar (ex: checkout.session.expired)
  return NextResponse.json({ received: true })
}