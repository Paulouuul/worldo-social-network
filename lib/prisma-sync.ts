// lib/prisma-sync.ts
import { esClient, LISTINGS_INDEX } from './elasticsearch';
import { baseClient } from './prisma';

// Se
/**
 * Busca os dados completos no banco e envia para o Elasticsearch
 */
export async function syncToListing(listingId: string, tx?: any) {
  try {
    const client = tx || baseClient;
    const listing = await client.cosmetic_listing.findUnique({
      where: { id: listingId },
      include: {
        frame: {
          include: {
            creator: {
              select: { name: true, username: true, avatar: true },
            },
          },
        },
        seller: {
          select: { name: true, username: true, avatar: true },
        },
      },
    });

    if (!listing) {
      console.log(`[Auto-sync] Listing ${listingId} not found`);
      return;
    }

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
        frameName: listing.frame.name,
        frameRarity: listing.frame.rarity,
        frameDescription: listing.frame.description ?? '',
        frameImageUrl: listing.frame.imageUrl,
        frameThumbnailUrl: listing.frame.thumbnailUrl,
        creatorId: listing.frame.createdBy,
        creatorName: listing.frame.creator?.name,
        creatorUsername: listing.frame.creator?.username,
        sellerName: listing.seller.name,
        sellerUsername: listing.seller.username,
        sellerAvatar: listing.seller.avatar,
      },
    });

    console.log(`[Auto-sync] Listing ${listingId} synced to Elasticsearch`);
  } catch (error) {
    console.error(`[Auto-sync] Failed to sync listing ${listingId}:`, error);
  }
}

/**
 * Remove o documento do Elasticsearch
 */
export async function removeFromElasticsearch(listingId: string) {
  try {
    await esClient.delete({
      index: LISTINGS_INDEX,
      id: listingId,
    });
    console.log(`[Auto-sync] Listing ${listingId} removed from Elasticsearch`);
  } catch (error) {
    console.error(`[Auto-sync] Error removing listing ${listingId} from ES:`, error);
  }
}
