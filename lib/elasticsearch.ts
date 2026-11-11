// lib/elasticsearch.ts
// Cliente do Elasticsearch e utilitários do índice de anúncios (cosmetic_listings): conexão,
// criação do índice e indexação, busca, atualização e remoção de documentos.

import { Client } from '@elastic/elasticsearch';
import { Rarity } from '@/constants/cosmeticRarity';

/** Documento de anúncio no índice cosmetic_listings. */
export interface ElasticsearchListing {
  id: string;
  frameId: string;
  sellerId: string;
  priceCoins: number;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  frameName: string;
  frameRarity: Rarity | string;
  frameDescription?: string;
  frameImage?: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  sellerName: string;
  sellerUsername: string;
  sellerAvatar?: string | null;
}

const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200';
const username = process.env.ELASTICSEARCH_USERNAME || 'elastic';
const password = process.env.ELASTICSEARCH_PASSWORD || 'StrongP@ssw0rd2024';

/**
 * Cliente configurado por ELASTICSEARCH_URL/USERNAME/PASSWORD (TLS sem verificação de
 * certificado).
 */
export const esClient = new Client({
  node: elasticsearchUrl,
  auth: {
    username,
    password,
  },
  maxRetries: 3,
  requestTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
  },
});

/** Nome do índice de anúncios. */
export const LISTINGS_INDEX = 'cosmetic_listings';

/** Testa a conexão (ping). Retorna true se o cluster respondeu. */
export async function checkElasticsearchConnection() {
  try {
    await esClient.ping();
    console.log('Elasticsearch connected and authenticated');
    return true;
  } catch (error) {
    console.error('XElasticsearch connection failed:', error);
    return false;
  }
}

/** Cria o índice de anúncios com o mapeamento dos campos, se ainda não existir. */
export async function setupElasticsearchIndices() {
  try {
    const exists = await esClient.indices.exists({
      index: LISTINGS_INDEX,
    });

    if (!exists) {
      await esClient.indices.create({
        index: LISTINGS_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            frameId: { type: 'keyword' },
            sellerId: { type: 'keyword' },
            priceCoins: { type: 'float' },
            quantity: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'date' },
            frameName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            frameRarity: { type: 'keyword' },
            frameDescription: { type: 'text' },
            frameImage: { type: 'keyword' },
            creatorId: { type: 'keyword' },
            creatorName: { type: 'text' },
            creatorUsername: { type: 'keyword' },
            sellerName: { type: 'text' },
            sellerUsername: { type: 'keyword' },
            sellerAvatar: { type: 'keyword' },
          },
        },
      });
      console.log(`IndeX${LISTINGS_INDEX} created`);
    } else {
      console.log(`IndeX${LISTINGS_INDEX} already exists`);
    }
  } catch (error) {
    console.error('Error setting up indices:', error);
    throw error;
  }
}

/**
 * Cria o índice de anúncios com analisador de autocomplete (minúsculas e sem acentos) no nome,
 * se ainda não existir.
 */
export async function setupElasticsearchIndicesWithCustomAnalysis() {
  try {
    const exists = await esClient.indices.exists({
      index: LISTINGS_INDEX,
    });

    if (!exists) {
      await esClient.indices.create({
        index: LISTINGS_INDEX,
        settings: {
          analysis: {
            analyzer: {
              autocomplete_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            frameId: { type: 'keyword' },
            sellerId: { type: 'keyword' },
            priceCoins: { type: 'float' },
            quantity: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'date' },
            frameName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                },
              },
            },
            frameRarity: { type: 'keyword' },
            frameDescription: { type: 'text' },
            frameImage: { type: 'keyword' },
            creatorId: { type: 'keyword' },
            creatorName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            creatorUsername: { type: 'keyword' },
            sellerName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            sellerUsername: { type: 'keyword' },
            sellerAvatar: { type: 'keyword' },
          },
        },
      });
      console.log(`IndeX${LISTINGS_INDEX} created with custom analysis`);
    }
  } catch (error) {
    console.error('Error setting up indices with custom analysis:', error);
    throw error;
  }
}

/** Indexa (cria ou substitui) o documento do anúncio. */
export async function indexListing(listing: ElasticsearchListing) {
  try {
    const document = {
      ...listing,
      frameRarity: listing.frameRarity,
    };
    const result = await esClient.index({
      index: LISTINGS_INDEX,
      id: listing.id,
      document,
    });
    return result;
  } catch (error) {
    console.error('Error indexing listing:', error);
    throw error;
  }
}

/** Executa uma busca no índice de anúncios com a query informada. */
export async function searchListings(query: any) {
  try {
    const result = await esClient.search({
      index: LISTINGS_INDEX,
      ...query,
    });
    return result;
  } catch (error) {
    console.error('Error searching listings:', error);
    throw error;
  }
}

/** Remove o documento do anúncio do índice. */
export async function deleteListing(indexId: string) {
  try {
    const result = await esClient.delete({
      index: LISTINGS_INDEX,
      id: indexId,
    });
    return result;
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

/** Atualiza parcialmente o documento do anúncio. */
export async function updateListing(indexId: string, updates: Partial<ElasticsearchListing>) {
  try {
    const result = await esClient.update({
      index: LISTINGS_INDEX,
      id: indexId,
      doc: updates,
    });
    return result;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}
