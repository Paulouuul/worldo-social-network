import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { convertToWebP } from '@/lib/image-converter'
import { uploadPublic, deleteFile } from '@/lib/r2-upload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Variáveis para controle de rollback do R2 se o banco falhar
  let uploadedImageUrl: string | null = null
  let uploadedThumbnailUrl: string | null = null

  const MAX_FRAME_SIZE = 5 * 1024 * 1024      // 5MB
  const MAX_FRAME_GIF = 3 * 1024 * 1024       // 3MB
  const MAX_THUMB_SIZE = 2 * 1024 * 1024      // 2MB
  const MAX_THUMB_GIF = 1 * 1024 * 1024       // 1MB
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  try {

    
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    
    if (!contentType.includes('multipart/form-data')) {

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
      return NextResponse.json({ error: 'Campos obrigatórios inválidos ou faltando' }, { status: 400 })
    }

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 })
    }

    // 2. VALIDAÇÃO DA IMAGEM PRINCIPAL (MOLDURA)
    const imgExtension = imageFile.name.split('.').pop()?.toLowerCase()
    
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type) || !imgExtension || !ALLOWED_EXTENSIONS.includes(imgExtension)) {
      return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, GIF ou WEBP' }, { status: 400 })
    }

    // Validação específica para GIF
    if (imageFile.type === 'image/gif' && imageFile.size > MAX_FRAME_GIF) {
      return NextResponse.json({ 
        error: `GIF para moldura deve ter no máximo ${MAX_FRAME_GIF / 1024 / 1024}MB.` 
      }, { status: 400 })
    }

    // Validação de tamanho normal
    if (imageFile.size > MAX_FRAME_SIZE) {
      return NextResponse.json({ 
        error: `Moldura deve ter no máximo ${MAX_FRAME_SIZE / 1024 / 1024}MB.` 
      }, { status: 400 })
    }

    // 3. VALIDAÇÃO DA THUMBNAIL (se existir)
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbExtension = thumbnailFile.name.split('.').pop()?.toLowerCase()
      
      if (!ALLOWED_MIME_TYPES.includes(thumbnailFile.type) || !thumbExtension || !ALLOWED_EXTENSIONS.includes(thumbExtension)) {
        return NextResponse.json({ error: 'Formato da miniatura não suportado. Use JPG, PNG, GIF ou WEBP' }, { status: 400 })
      }

      // Validação específica para GIF na thumbnail
      if (thumbnailFile.type === 'image/gif' && thumbnailFile.size > MAX_THUMB_GIF) {
        return NextResponse.json({ 
          error: `GIF para miniatura deve ter no máximo ${MAX_THUMB_GIF / 1024 / 1024}MB.` 
        }, { status: 400 })
      }

      // Validação de tamanho normal da thumbnail
      if (thumbnailFile.size > MAX_THUMB_SIZE) {
        return NextResponse.json({ 
          error: `Miniatura deve ter no máximo ${MAX_THUMB_SIZE / 1024 / 1024}MB.` 
        }, { status: 400 })
      }
    }

    // 2. Verificar custo e moedas ANTES do upload do arquivo
    console.log('[7] Buscando custo de criação para raridade:', rarity)
    const creationCost = await prisma.cosmetic_creation_cost.findUnique({
      where: { rarity }
    })

    if (!creationCost) {
      return NextResponse.json({ error: 'Raridade inválida' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { coins: true }
    })

    if ((user?.coins || 0) < creationCost.costCoins) {
      return NextResponse.json({ 
        error: `Moedas insuficientes. Você precisa de ${creationCost.costCoins} moedas.` 
      }, { status: 400 })
    }

    // 3. Processar uploads após validação de regras de negócio
    const timestamp = Date.now()
    
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const isGif = imageFile.type === 'image/gif'
    
    const converted = await convertToWebP(buffer, imageFile.type, {
      format: isGif ? 'webp-animated' : 'webp',
      quality: isGif ? 70 : 75,
      width: 512,
      height: 512,
      fit: 'inside',
    })
    
    const optimizedImage = new File([new Uint8Array(converted.buffer)], `image-${timestamp}.webp`, { 
      type: 'image/webp' 
    })
    
    const imgPath = `frames/${timestamp}-${session.user.id}/image.webp`
    uploadedImageUrl = await uploadPublic(optimizedImage, imgPath)

    if (thumbnailFile && thumbnailFile.size > 0) {
      console.log('[12] Convertendo e fazendo upload da thumbnail...')
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer())
      const isThumbGif = thumbnailFile.type === 'image/gif'
      
      const thumbConverted = await convertToWebP(thumbBuffer, thumbnailFile.type, {
        format: isThumbGif ? 'webp-animated' : 'webp',
        quality: isThumbGif ? 70 : 75,
        width: 512,
        height: 512,
        fit: 'cover',
      })
      
      const optimizedThumb = new File([new Uint8Array(thumbConverted.buffer)], `thumbnail-${timestamp}.webp`, { 
        type: 'image/webp' 
      })

      const thumbPath = `frames/${timestamp}-${session.user.id}/thumbnail.webp`
      uploadedThumbnailUrl = await uploadPublic(optimizedThumb, thumbPath)
      
    } else {
      uploadedThumbnailUrl = uploadedImageUrl
    }

    
    const result = await prisma.$transaction(async (tx) => {

      const updatedUser = await tx.users.update({
        where: { id: session.user.id },
        data: { coins: { decrement: creationCost.costCoins } }
      })


      if (updatedUser.coins < 0) {
          throw new Error('INSUFFICIENT_FUNDS')
      }


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



      const userFrameItems = Array.from({ length: stock }).map(() => ({
        frameId: frame.id,
        ownerId: session.user.id,
      }))

      await tx.user_frame_item.createMany({
        data: userFrameItems
      })



      await tx.coin_transaction.create({
        data: {
          userId: session.user.id,
          amount: -creationCost.costCoins,
          balance: updatedUser.coins,
          type: 'spend',
          description: `Criação de moldura: ${name} (${rarity})`,
        }
      })


      return frame
    })

    return NextResponse.json({ 
      success: true, 
      frame: result, 
      message: `Moldura criada! ${stock} unidade(s) adicionadas ao seu inventário.`
    }, { status: 201 })

  } catch (error: any) {

    // Se o banco falhou após o upload, limpa os arquivos do R2
    if (uploadedImageUrl) {
      await deleteFile(uploadedImageUrl).catch(console.error)
    }
    if (uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedImageUrl) {
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