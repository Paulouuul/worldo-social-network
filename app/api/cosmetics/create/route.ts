import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { uploadPublic, deleteFile } from '@/lib/r2-upload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Variáveis para controle de rollback do R2 se o banco falhar
  let uploadedImageUrl: string | null = null
  let uploadedThumbnailUrl: string | null = null

  try {
    console.log('[1] Iniciando criação de moldura...')
    
    const session = await auth()
    console.log('[2] Session user ID:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('[2.1] Usuário não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    console.log('[3] Content-Type:', contentType)
    
    if (!contentType.includes('multipart/form-data')) {
      console.log('[3.1] Content-Type inválido')
      return NextResponse.json({ error: 'Body da requisição inválido' }, { status: 400 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || null
    const rarity = formData.get('rarity') as string
    const stockStr = formData.get('stock') as string
    const stock = parseInt(stockStr)
    const imageFile = formData.get('image') as File | null
    const thumbnailFile = formData.get('thumbnail') as File | null

    console.log('[4] Dados recebidos:', {
      name,
      rarity,
      stock,
      hasImage: !!imageFile,
      imageSize: imageFile?.size,
      hasThumbnail: !!thumbnailFile,
    })

    // 1. Validação Rápida (Fail Fast)
    if (!name || !rarity || isNaN(stock) || stock <= 0) {
      console.log('[5] Campos obrigatórios inválidos:', { name, rarity, stock })
      return NextResponse.json({ error: 'Campos obrigatórios inválidos ou faltando' }, { status: 400 })
    }

    if (!imageFile || imageFile.size === 0) {
      console.log('[6] Imagem ausente')
      return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 })
    }

    // 2. Verificar custo e moedas ANTES do upload do arquivo
    console.log('[7] Buscando custo de criação para raridade:', rarity)
    const creationCost = await prisma.cosmetic_creation_cost.findUnique({
      where: { rarity }
    })

    if (!creationCost) {
      console.log('[7.1] Raridade inválida:', rarity)
      return NextResponse.json({ error: 'Raridade inválida' }, { status: 400 })
    }
    console.log('[7.2] Custo de criação:', creationCost.costCoins)

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { coins: true }
    })
    console.log('[8] Moedas do usuário:', user?.coins)

    if ((user?.coins || 0) < creationCost.costCoins) {
      console.log('[8.1] Moedas insuficientes')
      return NextResponse.json({ 
        error: `Moedas insuficientes. Você precisa de ${creationCost.costCoins} moedas.` 
      }, { status: 400 })
    }

    // 3. Processar uploads após validação de regras de negócio
    const timestamp = Date.now()
    console.log('[9] Iniciando upload da imagem...')
    
    const imgExtension = imageFile.name.split('.').pop()
    const imgPath = `frames/${timestamp}-${session.user.id}/image.${imgExtension}`
    uploadedImageUrl = await uploadPublic(imageFile, imgPath)
    console.log('[10] Upload da imagem concluído:', uploadedImageUrl)

    if (thumbnailFile && thumbnailFile.size > 0) {
      console.log('[11] Iniciando upload da thumbnail...')
      const thumbExtension = thumbnailFile.name.split('.').pop()
      const thumbPath = `frames/${timestamp}-${session.user.id}/thumbnail.${thumbExtension}`
      uploadedThumbnailUrl = await uploadPublic(thumbnailFile, thumbPath)
      console.log('[12] Upload da thumbnail concluído:', uploadedThumbnailUrl)
    } else {
      uploadedThumbnailUrl = uploadedImageUrl
      console.log('[11] Sem thumbnail, usando imagem principal')
    }

    // 4. Transação Única e Atômica no Banco de Dados
    console.log('[13] Iniciando transação no banco de dados...')
    
    const result = await prisma.$transaction(async (tx) => {
      console.log('[13.1] Deduzindo moedas...')
      const updatedUser = await tx.users.update({
        where: { id: session.user.id },
        data: { coins: { decrement: creationCost.costCoins } }
      })
      console.log('[13.2] Novo saldo:', updatedUser.coins)

      if (updatedUser.coins < 0) {
        console.log('[13.3] Saldo negativo detectado!')
        throw new Error('INSUFFICIENT_FUNDS')
      }

      console.log('[13.4] Criando registro da moldura...')
      const frame = await tx.cosmetic_frame.create({
        data: {
          name,
          description: description || '',
          imageUrl: uploadedImageUrl!,
          thumbnailUrl: uploadedThumbnailUrl || uploadedImageUrl!,
          rarity,
          stock,
          createdBy: session.user.id,
        }
      })
      console.log('[13.5] Moldura criada com ID:', frame.id)

      console.log('[13.6] Criando itens de inventário...')
      const userFrameItems = Array.from({ length: stock }).map(() => ({
        frameId: frame.id,
        ownerId: session.user.id,
      }))

      await tx.user_frame_item.createMany({
        data: userFrameItems
      })
      console.log('[13.7] Itens de inventário criados:', stock)

      console.log('[13.8] Registrando transação financeira...')
      await tx.coin_transaction.create({
        data: {
          userId: session.user.id,
          amount: -creationCost.costCoins,
          balance: updatedUser.coins,
          type: 'spend',
          description: `Criação de moldura: ${name} (${rarity})`,
        }
      })
      console.log('[13.9] Transação financeira registrada')

      return frame
    })

    console.log('[14] Sucesso! Moldura criada com sucesso!')
    return NextResponse.json({ 
      success: true, 
      frame: result, 
      message: `Moldura criada! ${stock} unidade(s) adicionadas ao seu inventário.`
    }, { status: 201 })

  } catch (error: any) {
    console.error('[ERRO] Detalhes completos:', error)

    // Se o banco falhou após o upload, limpa os arquivos do R2
    if (uploadedImageUrl) {
      console.log('Limpando arquivo do R2:', uploadedImageUrl)
      await deleteFile(uploadedImageUrl).catch(console.error)
    }
    if (uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedImageUrl) {
      console.log('Limpando thumbnail do R2:', uploadedThumbnailUrl)
      await deleteFile(uploadedThumbnailUrl).catch(console.error)
    }

    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'Moedas insuficientes' }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erro interno ao criar moldura',
      details: error.message 
    }, { status: 500 })
  }
}