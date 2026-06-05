// import { prisma } from '@/lib/prisma'
// import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth/next'

// // GET /api/frames - Listar todas as molduras ativas
// export async function GET(request: NextRequest) {
//   try {
//     // Pegar parâmetros de query (filtros opcionais)
//     const searchParams = request.nextUrl.searchParams
//     const category = searchParams.get('category')
//     const rarity = searchParams.get('rarity')
//     const search = searchParams.get('search')

//     // Construir filtros
//     const where: any = { isActive: true }

//     if (category && category !== 'todos') {
//       where.category = category
//     }

//     if (rarity && rarity !== 'todas') {
//       where.rarity = rarity
//     }

//     if (search) {
//       where.name = { contains: search, mode: 'insensitive' }
//     }

//     // Buscar molduras
//     const frames = await prisma.cosmetic_frame.findMany({
//       where,
//       orderBy: { createdAt: 'desc' },
//       include: {
//         creator: {
//           select: {
//             id: true,
//             name: true,
//             avatar: true
//           }
//         }
//       }
//     })

//     // Estatísticas adicionais
//     const totalCount = await prisma.cosmetic_frame.count({ where })
//     const categories = await prisma.cosmetic_frame.findMany({
//       where: { isActive: true },
//       select: { category: true },
//       distinct: ['category']
//     })

//     return NextResponse.json({
//       success: true,
//       data: frames,
//       meta: {
//         total: totalCount,
//         categories: categories.map(c => c.category)
//       }
//     })

//   } catch (error) {
//     console.error('Erro ao buscar molduras:', error)
//     return NextResponse.json(
//       { success: false, error: 'Erro ao buscar molduras' },
//       { status: 500 }
//     )
//   }
// }

// // POST /api/frames - Criar nova moldura (requer autenticação)
// export async function POST(request: NextRequest) {
//   try {
//     // Verificar autenticação (será implementado depois)
//     const session = await getServerSession()
//     if (!session) {
//       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
//     }

//     const body = await request.json()
//     const { name, description, imageUrl, thumbnailUrl, category, rarity, priceCoins, createdBy, stock } = body

//     // Validar campos obrigatórios
//     if (!name || !imageUrl || !category || !rarity || !priceCoins || !createdBy) {
//       return NextResponse.json(
//         { success: false, error: 'Campos obrigatórios faltando' },
//         { status: 400 }
//       )
//     }

//     // Verificar se a raridade existe
//     const creationCost = await prisma.cosmetic_creation_cost.findUnique({
//       where: { rarity }
//     })

//     if (!creationCost) {
//       return NextResponse.json(
//         { success: false, error: 'Raridade inválida' },
//         { status: 400 }
//       )
//     }

//     // Aqui você deve verificar se o usuário tem moedas suficientes
//     // (implementar depois com sistema de moedas)

//     // Criar a moldura
//     const frame = await prisma.cosmetic_frame.create({
//       data: {
//         name,
//         description: description || '',
//         imageUrl,
//         thumbnailUrl: thumbnailUrl || imageUrl,
//         category,
//         rarity,
//         priceCoins,
//         stock: stock || 1,
//         soldCount: 0,
//         createdBy,
//         isActive: true
//       },
//       include: {
//         creator: {
//           select: { name: true, avatar: true }
//         }
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       data: frame,
//       message: 'Moldura criada com sucesso!'
//     }, { status: 201 })

//   } catch (error) {
//     console.error('Erro ao criar moldura:', error)
//     return NextResponse.json(
//       { success: false, error: 'Erro ao criar moldura' },
//       { status: 500 }
//     )
//   }
// }

// // DELETE /api/frames/:id - Desativar moldura (soft delete)
// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const id = searchParams.get('id')

//     if (!id) {
//       return NextResponse.json(
//         { success: false, error: 'ID não fornecido' },
//         { status: 400 }
//       )
//     }

//     // Soft delete - apenas desativa
//     const frame = await prisma.cosmetic_frame.update({
//       where: { id },
//       data: {
//         isActive: false,
//         deletedAt: new Date()
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       message: 'Moldura desativada com sucesso'
//     })

//   } catch (error) {
//     console.error('Erro ao desativar moldura:', error)
//     return NextResponse.json(
//       { success: false, error: 'Erro ao desativar moldura' },
//       { status: 500 }
//     )
//   }
// }
