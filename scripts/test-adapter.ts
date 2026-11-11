// scripts/test-adapter.ts
// Script manual: testa a conexão do Prisma com o PostgreSQL executando SELECT NOW(). Executar
// com: npx tsx scripts/test-adapter.ts

import { prisma } from '../lib/prisma';

/** Conecta, executa a consulta e imprime o resultado. */
async function test() {
  try {
    await prisma.$connect();
    console.log('Prisma connected');

    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Query result:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
