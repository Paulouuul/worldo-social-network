// scripts/sync-elasticsearch.ts
// Script de manutenção: reindexa no Elasticsearch todos os anúncios ativos do PostgreSQL.
// Executar com: npx tsx scripts/sync-elasticsearch.ts

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { esClient, LISTINGS_INDEX, setupElasticsearchIndices } from '../lib/elasticsearch';

/** Garante o índice, lê os anúncios ativos com moldura, criador e vendedor e indexa cada um. */
async function syncExistingListings() {
  console.log('Starting Elasticsearch sync...');

  try {
    // Testa a conexão com o PostgreSQL
    const userCount = await prisma.users.count();
    console.log(`Connected to PostgreSQL. Users: ${userCount}`);

    // Garante que o índice existe
    await setupElasticsearchIndices();

    // Anúncios ativos
    const listings = await prisma.cosmetic_listing.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
      },
      include: {
        frame: {
          include: {
            creator: {
              select: {
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        seller: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    console.log(`Found ${listings.length} listings to sync`);

    if (listings.length === 0) {
      console.log('No active listings found in database');
      return;
    }

    let indexedCount = 0;
    for (const listing of listings) {
      try {
        // Mesmo formato de documento do sync automático (lib/prisma-sync.ts)
        await esClient.index({
          index: LISTINGS_INDEX,
          id: listing.id,
          document: {
            id: listing.id,
            frameId: listing.frameId,
            sellerId: listing.sellerId,
            priceCoins: listing.priceCoins,
            quantity: listing.quantity,
            isActive: listing.isActive,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
            // Moldura
            frameName: listing.frame.name,
            frameRarity: listing.frame.rarity,
            frameDescription: listing.frame.description || '',
            frameImage: listing.frame.imageUrl,
            frameImageUrl: listing.frame.imageUrl,
            frameThumbnailUrl: listing.frame.thumbnailUrl,
            // Criador
            creatorId: listing.frame.createdBy,
            creatorName: listing.frame.creator?.name,
            creatorUsername: listing.frame.creator?.username,
            creatorAvatar: listing.frame.creator?.avatar,
            // Vendedor
            sellerName: listing.seller.name,
            sellerUsername: listing.seller.username,
            sellerAvatar: listing.seller.avatar,
          },
        });
        indexedCount++;

        // Progresso a cada 10 itens
        if (indexedCount % 10 === 0) {
          console.log(`   Indexed ${indexedCount}/${listings.length} listings`);
        }
      } catch (error) {
        console.error(`   Failed to index listing ${listing.id}:`, error);
      }
    }

    console.log(`Synced ${indexedCount}/${listings.length} listings to Elasticsearch`);

    // Total no índice
    const count = await esClient.count({ index: LISTINGS_INDEX });
    console.log(`Total documents in Elasticsearch: ${count.count}`);
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncExistingListings();
