// tests/test-connection.ts
// Script manual: testa a conexão com o banco listando contagem de usuários, pacotes de moedas e
// molduras. Executar com: npx tsx tests/test-connection.ts

import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

/** Consulta e imprime usuários, pacotes de moedas e molduras. */
async function test() {
  console.log('Testando conexão com o banco...');

  try {
    // Conta usuários
    const userCount = await prisma.users.count();
    console.log(`Usuários: ${userCount}`);

    // Lista pacotes de moedas
    const packages = await prisma.coin_package.findMany();
    console.log(`Pacotes de moedas: ${packages.length}`);
    packages.forEach((pkg) => {
      console.log(`   - ${pkg.name}: ${pkg.coins} moedas por R$${pkg.priceReal}`);
    });

    // Lista molduras
    const frames = await prisma.cosmetic_frame.findMany();
    console.log(`Molduras: ${frames.length}`);
    frames.forEach((frame) => {
      console.log(`   - ${frame.name} (${frame.rarity})`);
    });

    console.log('\nTodos os testes passaram! Banco está funcionando perfeitamente.');
  } catch (error) {
    console.error('Erro ao conectar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
