// scripts/clean-elasticsearch.ts
// Script de manutenção: remove do Elasticsearch os documentos de anúncios que não estão mais
// ativos no PostgreSQL. Executar com: npx tsx scripts/clean-elasticsearch.ts

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { esClient, LISTINGS_INDEX } from '../lib/elasticsearch';

/** Compara os ids do índice com os anúncios ativos no banco e apaga os órfãos em lotes. */
async function cleanElasticsearch() {
  console.log('Starting Elasticsearch cleanup...');

  try {
    // Ids dos anúncios ativos no PostgreSQL
    const activeListings = await prisma.cosmetic_listing.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
      },
      select: { id: true },
    });

    const activeIds = new Set(activeListings.map((l) => l.id));
    console.log(`Found ${activeIds.size} active listings in PostgreSQL`);

    // Ids presentes no Elasticsearch
    const result = await esClient.search({
      index: LISTINGS_INDEX,
      size: 10000,
      _source: false,
      fields: ['id'],
    });

    // Descarta ids indefinidos
    const elasticIds = result.hits.hits
      .map((hit) => hit._id)
      .filter((id): id is string => id !== undefined);

    console.log(`Found ${elasticIds.length} documents in Elasticsearch`);

    // Ids no índice sem anúncio ativo correspondente
    const idsToRemove = elasticIds.filter((id) => !activeIds.has(id));
    console.log(`Found ${idsToRemove.length} documents to remove`);

    if (idsToRemove.length === 0) {
      console.log('No documents to remove');
      return;
    }

    // Remove em lotes
    const batchSize = 100;
    for (let i = 0; i < idsToRemove.length; i += batchSize) {
      const batch = idsToRemove.slice(i, i + batchSize);

      const body = batch.flatMap((id) => [{ delete: { _index: LISTINGS_INDEX, _id: id } }]);

      const response = await esClient.bulk({ body });

      if (response.errors) {
        console.error('Bulk delete had errors:', response.errors);
      }

      console.log(
        `   Removed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(idsToRemove.length / batchSize)}`,
      );
    }

    console.log(`Successfully removed ${idsToRemove.length} stale documents`);

    // Total restante no índice
    const count = await esClient.count({ index: LISTINGS_INDEX });
    console.log(`Total documents in Elasticsearch: ${count.count}`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanElasticsearch();
