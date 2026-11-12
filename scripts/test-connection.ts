// scripts/test-connection.ts
// Script manual: testa a conexão com o Elasticsearch e cria o índice de anúncios se necessário.
// Executar com: npx tsx scripts/test-connection.ts

import {
  checkElasticsearchConnection,
  setupElasticsearchIndices,
} from '../lib/search/elasticsearch';

/** Faz ping no cluster e, se conectado, cria o índice; senão mostra como subir o container. */
async function test() {
  console.log('Testing Elasticsearch connection...\n');

  const isConnected = await checkElasticsearchConnection();

  if (isConnected) {
    console.log('Connection successful!\n');

    // Cria o índice de anúncios se ainda não existir
    console.log('Setting up indices...');
    await setupElasticsearchIndices();

    console.log('\nElasticsearch is ready to use!');
  } else {
    console.log('Failed to connect to Elasticsearch');
    console.log('\nVerifique se o container está rodando:');
    console.log('  docker ps | grep elasticsearch');
    console.log('\nSe não estiver, inicie com:');
    console.log('  docker-compose up -d elasticsearch');
  }
}

test();
