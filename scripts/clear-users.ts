import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env')
}

const pool = new Pool({
  connectionString: DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function clearUsers() {
  try {
    console.log('🗑️  Removendo dados...')

    // 1. Remover tokens de verificação
    const deletedTokens = await prisma.verification_tokens.deleteMany()
    console.log(`✅ ${deletedTokens.count} tokens de verificação removidos`)

    // 2. Remover itens de usuários
    const deletedItems = await prisma.user_frame_item.deleteMany()
    console.log(`✅ ${deletedItems.count} itens de usuários removidos`)

    // 3. Remover vendas (cosmetic_purchase)
    const deletedPurchases = await prisma.cosmetic_purchase.deleteMany()
    console.log(`✅ ${deletedPurchases.count} compras removidas`)

    // 4. Remover revendas (cosmetic_resale)
    const deletedResales = await prisma.cosmetic_resale.deleteMany()
    console.log(`✅ ${deletedResales.count} revendas removidas`)

    // 5. Remover molduras (cosmetic_frame)
    const deletedFrames = await prisma.cosmetic_frame.deleteMany()
    console.log(`✅ ${deletedFrames.count} molduras removidas`)

    // 6. Remover sessões
    const deletedSessions = await prisma.sessions.deleteMany()
    console.log(`✅ ${deletedSessions.count} sessões removidas`)

    // 7. Remover contas OAuth
    const deletedAccounts = await prisma.accounts.deleteMany()
    console.log(`✅ ${deletedAccounts.count} contas OAuth removidas`)

    // 8. Remover chats e membros
    const deletedChatMembers = await prisma.chat_member.deleteMany()
    console.log(`✅ ${deletedChatMembers.count} membros de chat removidos`)

    const deletedChats = await prisma.chat.deleteMany()
    console.log(`✅ ${deletedChats.count} chats removidos`)

    // 9. Remover posts, comments, likes
    const deletedLikes = await prisma.like.deleteMany()
    console.log(`✅ ${deletedLikes.count} likes removidos`)

    const deletedComments = await prisma.comment.deleteMany()
    console.log(`✅ ${deletedComments.count} comentários removidos`)

    const deletedPosts = await prisma.post.deleteMany()
    console.log(`✅ ${deletedPosts.count} posts removidos`)

    // 10. Remover follows
    const deletedFollows = await prisma.follow.deleteMany()
    console.log(`✅ ${deletedFollows.count} follows removidos`)

    // 11. Remover transações de moedas
    const deletedCoinTransactions = await prisma.coin_transaction.deleteMany()
    console.log(`✅ ${deletedCoinTransactions.count} transações de moedas removidas`)

    const deletedCoinPurchases = await prisma.coin_purchase.deleteMany()
    console.log(`✅ ${deletedCoinPurchases.count} compras de moedas removidas`)

    // 12. Finalmente, remover os usuários
    const deletedUsers = await prisma.users.deleteMany()
    console.log(`✅ ${deletedUsers.count} usuários removidos`)

    console.log('🎉 Todos os usuários foram removidos com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao remover usuários:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearUsers()