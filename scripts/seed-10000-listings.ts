// scripts/seed-10000-listings.ts
// Script de carga para testes: indexa 10.000 anúncios fictícios no Elasticsearch usando um
// vendedor e molduras existentes. Executar com: npx tsx scripts/seed-10000-listings.ts

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { esClient, LISTINGS_INDEX } from '../lib/elasticsearch';

/** Gera e indexa em bulk 10.000 documentos de anúncio e imprime alguns exemplos. */
async function seed10000Listings() {
  console.log('Gerando 10000 listings para teste...');
  console.log('========================================');

  try {
    // Vendedor que já possui anúncios
    const seller = await prisma.users.findFirst({
      where: {
        listings: {
          some: {},
        },
      },
    });

    if (!seller) {
      console.error('Nenhum vendedor encontrado');
      return;
    }

    console.log(`Vendedor: ${seller.username} (${seller.id})`);

    // Molduras existentes (até 20)
    const frames = await prisma.cosmetic_frame.findMany({
      where: {
        isActive: true,
      },
      include: {
        creator: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      take: 20,
    });

    if (frames.length === 0) {
      console.error('Nenhum frame encontrado');
      return;
    }

    console.log(`${frames.length} frames disponíveis`);

    // Documentos fictícios
    const listings = [];
    const rarities = ['COMUM', 'INCOMUM', 'RARA', 'EPICO', 'LENDARIO', 'MITICO'];
    const names = [
      'Frame Solar',
      'Frame Lunar',
      'Frame Estelar',
      'Frame Galáctico',
      'Frame Nebuloso',
      'Frame Cósmico',
      'Frame Aurora',
      'Frame Eclipse',
      'Frame Supernova',
      'Frame Quasar',
      'Frame Pulsar',
      'Frame Cometa',
      'Frame Asteroide',
      'Frame Planeta',
      'Frame Estrela',
      'Frame Universo',
      'Frame Dimensional',
      'Frame Temporal',
      'Frame Espacial',
      'Frame Divino',
    ];

    for (let i = 0; i < 10000; i++) {
      const frame = frames[i % frames.length];
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      const price = Math.floor(Math.random() * 10000) + 100;
      const quantity = Math.floor(Math.random() * 50) + 1;

      listings.push({
        id: `seed_listing_${Date.now()}_${i}`,
        frameId: frame.id,
        sellerId: seller.id,
        priceCoins: price,
        quantity: quantity,
        isActive: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        frameName: `${names[i % names.length]} ${i + 1}`,
        frameRarity: rarity,
        frameDescription: `Descrição do frame ${i + 1} - Raridade ${rarity}`,
        frameImageUrl: frame.imageUrl || 'https://example.com/frame.png',
        frameThumbnailUrl: frame.thumbnailUrl || frame.imageUrl || 'https://example.com/frame.png',
        creatorName: frame.creator?.name || 'Criador Desconhecido',
        creatorUsername: frame.creator?.username || 'desconhecido',
        creatorAvatar: frame.creator?.avatar || null,
        sellerName: seller.name || seller.username,
        sellerUsername: seller.username,
        sellerAvatar: seller.avatar || null,
      });
    }

    console.log(`📦 ${listings.length} listings gerados`);

    // Indexação em bulk
    console.log('💾 Inserindo no Elasticsearch...');

    const body = listings.flatMap((doc) => [
      { index: { _index: LISTINGS_INDEX, _id: doc.id } },
      doc,
    ]);

    const response = await esClient.bulk({
      body,
      refresh: true,
      timeout: '60s',
    });

    if (response.errors) {
      console.error('Erros ao inserir:', JSON.stringify(response.errors, null, 2));
    } else {
      console.log(`${listings.length} listings inseridos com sucesso!`);
    }

    // Total no índice
    const count = await esClient.count({ index: LISTINGS_INDEX });
    console.log(`Total de documentos no Elasticsearch: ${count.count}`);

    // Exemplos indexados
    const search = await esClient.search({
      index: LISTINGS_INDEX,
      size: 5,
      query: { match_all: {} },
      sort: [{ createdAt: { order: 'desc' } }],
      _source: ['frameName', 'priceCoins', 'sellerName'],
    });

    console.log('Últimos listings inseridos:');
    search.hits.hits.forEach((hit: any) => {
      console.log(`  - ${hit._source.frameName} (${hit._source.priceCoins} coins)`);
    });

    console.log('========================================');
    console.log('Seed concluído!');
  } catch (error) {
    console.error('Erro:', error);
  }
}

seed10000Listings();
