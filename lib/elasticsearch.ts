// lib/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';

const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200';
const username = process.env.ELASTICSEARCH_USERNAME || 'elastic';
const password = process.env.ELASTICSEARCH_PASSWORD || 'StrongP@ssw0rd2024';

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

export const LISTINGS_INDEX= 'cosmetic_listings';

// Verificar conexão
export async function checkElasticsearchConnection() {
  try {
    // Agora realmente testa a conexão
    await esClient.ping();
    console.log('Elasticsearch connected and authenticated');
    return true;
  } catch (error) {
    console.error('XElasticsearch connection failed:', error);
    return false;
  }
}

// Criar índice com mapeamento
export async function setupElasticsearchIndices() {
  try {
    // Verificar se índice existe
    const exists = await esClient.indices.exists({
      index: LISTINGS_INDEX,
    });

    if (!exists) {
      // Criar índice com configuração
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
    throw error; // Adicionado throw para melhor tratamento de erro
  }
}

// Versão alternativa com configurações customizadas
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

// Função utilitária para indexar documentos
export async function indexListing(listing: any) {
  try {
    const result = await esClient.index({
      index: LISTINGS_INDEX,
      id: listing.id,
      document: listing,
    });
    return result;
  } catch (error) {
    console.error('Error indexing listing:', error);
    throw error;
  }
}

// Função utilitária para buscar listings
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

// Função utilitária para deletar listing
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

// Função utilitária para atualizar listing
export async function updateListing(indexId: string, updates: any) {
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
