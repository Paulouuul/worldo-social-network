import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearUsers() {
  try {
    // 1. Primeiro, registros mais específicos/filhos
    const deletedReviewLikes = await prisma.cosmetic_review_like.deleteMany();
    console.log(`${deletedReviewLikes.count} likes de reviews removidos`);

    const deletedReviews = await prisma.cosmetic_review.deleteMany();
    console.log(`${deletedReviews.count} reviews removidas`);

    // 2. Itens de usuários (depende de purchase, listing e frame)
    const deletedItems = await prisma.user_frame_item.deleteMany();
    console.log(`${deletedItems.count} itens de usuários removidos`);

    // 3. Listagens (depende de frame)
    const deletedListings = await prisma.cosmetic_listing.deleteMany();
    console.log(`${deletedListings.count} listings removidos`);

    // 4. Compras (depende de frame)
    const deletedPurchases = await prisma.cosmetic_purchase.deleteMany();
    console.log(`${deletedPurchases.count} compras removidas`);

    // 5. Molduras (agora pode deletar)
    const deletedFrames = await prisma.cosmetic_frame.deleteMany();
    console.log(`${deletedFrames.count} molduras removidas`);

    // 6. Tokens de verificação
    const deletedTokens = await prisma.verification_tokens.deleteMany();
    console.log(`${deletedTokens.count} tokens de verificação removidos`);

    // 7. Contas OAuth
    const deletedAccounts = await prisma.accounts.deleteMany();
    console.log(`${deletedAccounts.count} contas OAuth removidas`);

    // 8. Chats e membros
    const deletedChatMembers = await prisma.chat_member.deleteMany();
    console.log(`${deletedChatMembers.count} membros de chat removidos`);

    const deletedChats = await prisma.chat.deleteMany();
    console.log(`${deletedChats.count} chats removidos`);

    // 9. Likes, comments, posts
    const deletedLikes = await prisma.like.deleteMany();
    console.log(`${deletedLikes.count} likes removidos`);

    const deletedComments = await prisma.comment.deleteMany();
    console.log(`${deletedComments.count} comentários removidos`);

    const deletedPosts = await prisma.post.deleteMany();
    console.log(`${deletedPosts.count} posts removidos`);

    // 10. Follows
    const deletedFollows = await prisma.follow.deleteMany();
    console.log(`${deletedFollows.count} follows removidos`);

    // 11. Transações de moedas
    const deletedCoinTransactions = await prisma.coin_transaction.deleteMany();
    console.log(`${deletedCoinTransactions.count} transações de moedas removidas`);

    const deletedCoinPurchases = await prisma.coin_purchase.deleteMany();
    console.log(`${deletedCoinPurchases.count} compras de moedas removidas`);

    // 12. Finalmente, usuários
    const deletedUsers = await prisma.users.deleteMany();
    console.log(`${deletedUsers.count} usuários removidos`);

    console.log('Todos os usuários foram removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao remover usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
