import { PrismaClient, Rarity } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

console.log('1. Iniciando configuração...');
// Cria a pool de conexões com o banco de dados
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env');
}
console.log('2. DATABASE_URL OK:', DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
});
console.log('3. Pool criada');

// Cria o adaptador para o Prisma (PASSO CRUCIAL)
const adapter = new PrismaPg(pool);
console.log('4. Adapter criado');

// Instancia o PrismaClient passando o adaptador como parâmetro
const prisma = new PrismaClient({ adapter });
console.log('5. PrismaClient criado:', !!prisma);

async function main() {
  console.log('Starting seed...');

  // ============================================
  // 0. PLATFORM FEE (TAXA DA PLATAFORMA)
  // ============================================
  console.log('\n📌 Configurando plataform fee...');

  const existingFee = await prisma.platform_fee.findFirst({
    where: { isActive: true },
  });

  const feeData = {
    feeValue: 5, // 5% de taxa
    isActive: true,
  };

  if (existingFee) {
    await prisma.platform_fee.update({
      where: { id: existingFee.id },
      data: feeData,
    });
    console.log(`Platform fee atualizada: ${feeData.feeValue}%`);
  } else {
    await prisma.platform_fee.create({ data: feeData });
    console.log(`Platform fee criada: ${feeData.feeValue}%`);
  }

  // ============================================
  // 1. PACOTES DE MOEDAS (COMPRA COM DINHEIRO REAL)
  // ============================================
  const coinPackages = [
    { name: '100 Moedas', coins: 100, priceReal: 12.0, bonusCoins: 10 },
    { name: '250 Moedas', coins: 250, priceReal: 30.0, bonusCoins: 30 },
    { name: '500 Moedas', coins: 500, priceReal: 60.0, bonusCoins: 75 },
    { name: '1000 Moedas', coins: 1000, priceReal: 120.0, bonusCoins: 200 },
    { name: '2500 Moedas', coins: 2500, priceReal: 300.0, bonusCoins: 500 },
    { name: '5000 Moedas', coins: 5000, priceReal: 600.0, bonusCoins: 1250 },
  ];

  for (const pkg of coinPackages) {
    const existing = await prisma.coin_package.findFirst({
      where: { name: pkg.name },
    });

    if (existing) {
      await prisma.coin_package.update({
        where: { id: existing.id },
        data: pkg,
      });
    } else {
      await prisma.coin_package.create({ data: pkg });
    }
    console.log(`Pacote de moedas: ${pkg.name} - ${pkg.coins} moedas por R$${pkg.priceReal}`);
  }

  // ============================================
  // 3. PACOTES DE CRIAÇÃO
  // ============================================
  const cosmeticCreationPackages = [
    // PACOTES PARA COMUM (base: 50)
    {
      name: 'Pacote Básico',
      rarity: Rarity.COMUM,
      quantity: 10,
      totalCost: 25,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.COMUM,
      quantity: 50,
      totalCost: 40,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.COMUM,
      quantity: 100,
      totalCost: 50,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.COMUM,
      quantity: 500,
      totalCost: 125,
    },

    // PACOTES PARA RARO (base: 200)
    {
      name: 'Pacote Básico',
      rarity: Rarity.RARO,
      quantity: 10,
      totalCost: 100,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.RARO,
      quantity: 50,
      totalCost: 150,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.RARO,
      quantity: 100,
      totalCost: 200,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.RARO,
      quantity: 500,
      totalCost: 500,
    },

    // PACOTES PARA EPICO (base: 500)
    {
      name: 'Pacote Básico',
      rarity: Rarity.EPICO,
      quantity: 10,
      totalCost: 250,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.EPICO,
      quantity: 50,
      totalCost: 375,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.EPICO,
      quantity: 100,
      totalCost: 500,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.EPICO,
      quantity: 500,
      totalCost: 1250,
    },

    // PACOTES PARA LENDARIO (base: 1000)
    {
      name: 'Pacote Básico',
      rarity: Rarity.LENDARIO,
      quantity: 10,
      totalCost: 500,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.LENDARIO,
      quantity: 50,
      totalCost: 750,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.LENDARIO,
      quantity: 100,
      totalCost: 1000,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.LENDARIO,
      quantity: 500,
      totalCost: 2500,
    },
  ];

  for (const pkg of cosmeticCreationPackages) {
    const existing = await prisma.cosmetic_creation_package.findFirst({
      where: {
        rarity: pkg.rarity,
        quantity: pkg.quantity,
      },
    });

    if (existing) {
      await prisma.cosmetic_creation_package.update({
        where: { id: existing.id },
        data: pkg,
      });
    } else {
      await prisma.cosmetic_creation_package.create({ data: pkg });
    }
    console.log(
      `Pacote de criação: ${pkg.rarity} - ${pkg.name} (${pkg.quantity} unidades por ${pkg.totalCost} moedas)`,
    );
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
