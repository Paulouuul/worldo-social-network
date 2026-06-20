// scripts/test-connection.ts
import { checkElasticsearchConnection, setupElasticsearchIndices } from '../lib/elasticsearch';

async function test() {
  console.log('Testing Elasticsearch connection...\n');

  // Testar conexão
  const isConnected = await checkElasticsearchConnection();

  if (isConnected) {
    console.log('Connection successful!\n');

    // Setup dos índices
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
