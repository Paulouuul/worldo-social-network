import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function test() {
  console.log('Testando conexão com o banco...');

  try {
    // 1. Contar usuários
    const userCount = await prisma.users.count();
    console.log(`Usuários: ${userCount}`);

    // 2. Listar pacotes de moedas
    const packages = await prisma.coin_package.findMany();
    console.log(`Pacotes de moedas: ${packages.length}`);
    packages.forEach((pkg) => {
      console.log(`   - ${pkg.name}: ${pkg.coins} moedas por R$${pkg.priceReal}`);
    });

    // 3. Listar molduras
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
