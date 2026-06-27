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
    { name: '100 Moedas', coins: 100, priceReal: 5.0, bonusCoins: 0, sortOrder: 1 },
    { name: '500 Moedas', coins: 500, priceReal: 20.0, bonusCoins: 50, sortOrder: 2 },
    { name: '1000 Moedas', coins: 1000, priceReal: 35.0, bonusCoins: 150, sortOrder: 3 },
    { name: '5000 Moedas', coins: 5000, priceReal: 150.0, bonusCoins: 1000, sortOrder: 4 },
    { name: '10000 Moedas', coins: 10000, priceReal: 250.0, bonusCoins: 2000, sortOrder: 5 },
    { name: '25000 Moedas', coins: 25000, priceReal: 600.0, bonusCoins: 6000, sortOrder: 6 },
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
  // 2. CUSTOS BASE PARA CRIAR MOLDURAS
  // ============================================
  const creationCosts = [
    { rarity: Rarity.COMUM, costCoins: 50 },
    { rarity: Rarity.RARO, costCoins: 200 },
    { rarity: Rarity.EPICO, costCoins: 500 },
    { rarity: Rarity.LENDARIO, costCoins: 1000 },
  ];

  for (const cost of creationCosts) {
    const existing = await prisma.cosmetic_creation_cost.findFirst({
      where: { rarity: cost.rarity },
    });

    if (existing) {
      await prisma.cosmetic_creation_cost.update({
        where: { id: existing.id },
        data: cost,
      });
    } else {
      await prisma.cosmetic_creation_cost.create({ data: cost });
    }
    console.log(`Custo base: ${cost.rarity} - ${cost.costCoins} moedas`);
  }

  // ============================================
  // 3. PACOTES DE CRIAÇÃO (COM MULTIPLICADOR)
  // ============================================
  const creationPackages = [
    // PACOTES PARA COMUM (base: 50)
    {
      name: 'Pacote Básico',
      rarity: Rarity.COMUM,
      quantity: 10,
      multiplier: 1,
      totalCost: 50,
      sortOrder: 1,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.COMUM,
      quantity: 50,
      multiplier: 1.5,
      totalCost: 75,
      sortOrder: 2,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.COMUM,
      quantity: 100,
      multiplier: 2,
      totalCost: 100,
      sortOrder: 3,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.COMUM,
      quantity: 500,
      multiplier: 5,
      totalCost: 250,
      sortOrder: 4,
    },

    // PACOTES PARA RARO (base: 200)
    {
      name: 'Pacote Básico',
      rarity: Rarity.RARO,
      quantity: 10,
      multiplier: 1,
      totalCost: 200,
      sortOrder: 1,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.RARO,
      quantity: 50,
      multiplier: 1.5,
      totalCost: 300,
      sortOrder: 2,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.RARO,
      quantity: 100,
      multiplier: 2,
      totalCost: 400,
      sortOrder: 3,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.RARO,
      quantity: 500,
      multiplier: 5,
      totalCost: 1000,
      sortOrder: 4,
    },

    // PACOTES PARA EPICO (base: 500)
    {
      name: 'Pacote Básico',
      rarity: Rarity.EPICO,
      quantity: 10,
      multiplier: 1,
      totalCost: 500,
      sortOrder: 1,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.EPICO,
      quantity: 50,
      multiplier: 1.5,
      totalCost: 750,
      sortOrder: 2,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.EPICO,
      quantity: 100,
      multiplier: 2,
      totalCost: 1000,
      sortOrder: 3,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.EPICO,
      quantity: 500,
      multiplier: 5,
      totalCost: 2500,
      sortOrder: 4,
    },

    // PACOTES PARA LENDARIO (base: 1000)
    {
      name: 'Pacote Básico',
      rarity: Rarity.LENDARIO,
      quantity: 10,
      multiplier: 1,
      totalCost: 1000,
      sortOrder: 1,
    },
    {
      name: 'Pacote Comercial',
      rarity: Rarity.LENDARIO,
      quantity: 50,
      multiplier: 1.5,
      totalCost: 1500,
      sortOrder: 2,
    },
    {
      name: 'Pacote Empresarial',
      rarity: Rarity.LENDARIO,
      quantity: 100,
      multiplier: 2,
      totalCost: 2000,
      sortOrder: 3,
    },
    {
      name: 'Pacote Máster',
      rarity: Rarity.LENDARIO,
      quantity: 500,
      multiplier: 5,
      totalCost: 5000,
      sortOrder: 4,
    },
  ];

  for (const pkg of creationPackages) {
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
