// scripts/clear-users.ts
// Script destrutivo de desenvolvimento: apaga todos os usuários e os dados ligados a eles
// (cosméticos, anúncios, compras, chats, posts, transações), respeitando a ordem das chaves
// estrangeiras. Executar com: npx tsx scripts/clear-users.ts

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

/**
 * Apaga as tabelas dependentes e por fim os usuários, imprimindo quantos registros saíram de
 * cada uma.
 */
async function clearUsers() {
  try {
    // Registros mais dependentes primeiro (likes e avaliações)
    const deletedReviewLikes = await prisma.cosmetic_review_like.deleteMany();
    console.log(`${deletedReviewLikes.count} likes de reviews removidos`);

    const deletedReviews = await prisma.cosmetic_review.deleteMany();
    console.log(`${deletedReviews.count} reviews removidas`);

    // Itens de usuários (dependem de compras, anúncios e molduras)
    const deletedItems = await prisma.user_frame_item.deleteMany();
    console.log(`${deletedItems.count} itens de usuários removidos`);

    // Anúncios (dependem de molduras)
    const deletedListings = await prisma.cosmetic_listing.deleteMany();
    console.log(`${deletedListings.count} listings removidos`);

    // Compras (dependem de molduras)
    const deletedPurchases = await prisma.cosmetic_purchase.deleteMany();
    console.log(`${deletedPurchases.count} compras removidas`);

    // Molduras
    const deletedFrames = await prisma.cosmetic_frame.deleteMany();
    console.log(`${deletedFrames.count} molduras removidas`);

    // Tokens de verificação
    const deletedTokens = await prisma.verification_tokens.deleteMany();
    console.log(`${deletedTokens.count} tokens de verificação removidos`);

    // Contas OAuth
    const deletedAccounts = await prisma.accounts.deleteMany();
    console.log(`${deletedAccounts.count} contas OAuth removidas`);

    // Chats e membros
    const deletedChatMembers = await prisma.chat_member.deleteMany();
    console.log(`${deletedChatMembers.count} membros de chat removidos`);

    const deletedChats = await prisma.chat.deleteMany();
    console.log(`${deletedChats.count} chats removidos`);

    // Likes, comentários e posts
    const deletedLikes = await prisma.like.deleteMany();
    console.log(`${deletedLikes.count} likes removidos`);

    const deletedComments = await prisma.comment.deleteMany();
    console.log(`${deletedComments.count} comentários removidos`);

    const deletedPosts = await prisma.post.deleteMany();
    console.log(`${deletedPosts.count} posts removidos`);

    // Follows
    const deletedFollows = await prisma.follow.deleteMany();
    console.log(`${deletedFollows.count} follows removidos`);

    // Transações e compras de moedas
    const deletedCoinTransactions = await prisma.coin_transaction.deleteMany();
    console.log(`${deletedCoinTransactions.count} transações de moedas removidas`);

    const deletedCoinPurchases = await prisma.coin_purchase.deleteMany();
    console.log(`${deletedCoinPurchases.count} compras de moedas removidas`);

    // Usuários
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
