import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

console.log('1. Iniciando configuração...')
// Cria a pool de conexões com o banco de dados
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env')
}
console.log('2. DATABASE_URL OK:', DATABASE_URL)

const pool = new Pool({
  connectionString: DATABASE_URL,
})
console.log('3. Pool criada')

// Cria o adaptador para o Prisma (PASSO CRUCIAL)
const adapter = new PrismaPg(pool)
console.log('4. Adapter criado')

// Instancia o PrismaClient passando o adaptador como parâmetro
const prisma = new PrismaClient({ adapter })
console.log('5. PrismaClient criado:', !!prisma)

async function main() {
  console.log('Starting seed...')

  // ============================================
  // 1. PACOTES DE MOEDAS
  // ============================================
  const coinPackages = [
    { name: "100 Moedas", coins: 100, priceReal: 5.00, bonusCoins: 0, sortOrder: 1 },
    { name: "500 Moedas", coins: 500, priceReal: 20.00, bonusCoins: 50, sortOrder: 2 },
    { name: "1000 Moedas", coins: 1000, priceReal: 35.00, bonusCoins: 150, sortOrder: 3 },
    { name: "5000 Moedas", coins: 5000, priceReal: 150.00, bonusCoins: 1000, sortOrder: 4 },
  ]

  for (const pkg of coinPackages) {
    const existing = await prisma.coin_package.findFirst({
      where: { name: pkg.name }
    })
    
    if (existing) {
      await prisma.coin_package.update({
        where: { id: existing.id },
        data: pkg,
      })
    } else {
      await prisma.coin_package.create({ data: pkg })
    }
    console.log(`Pacote: ${pkg.name} - ${pkg.coins} moedas por R$${pkg.priceReal}`)
  }

  // ============================================
  // 2. CUSTOS PARA CRIAR MOLDURAS
  // ============================================
  const creationCosts = [
    { rarity: "COMUM", costCoins: 50, timeMinutes: 5 },
    { rarity: "RARO", costCoins: 200, timeMinutes: 15 },
    { rarity: "EPICO", costCoins: 500, timeMinutes: 30 },
    { rarity: "LENDARIO", costCoins: 1000, timeMinutes: 60 },
  ]

  for (const cost of creationCosts) {
    const existing = await prisma.cosmetic_creation_cost.findFirst({
      where: { rarity: cost.rarity }
    })
    
    if (existing) {
      await prisma.cosmetic_creation_cost.update({
        where: { id: existing.id },
        data: cost,
      })
    } else {
      await prisma.cosmetic_creation_cost.create({ data: cost })
    }
    console.log(`Custo de criação: ${cost.rarity} - ${cost.costCoins} moedas`)
  }

  // ============================================
  // 3. MOLDURAS DE EXEMPLO (Cosméticos)
  // ============================================
  
  // Primeiro, crie um usuário admin/vendedor padrão se não existir
  let adminUser = await prisma.users.findFirst({
    where: { email: "admin@exemplo.com" }
  })

  if (!adminUser) {
    adminUser = await prisma.users.create({
      data: {
        email: "admin@exemplo.com",
        name: "Admin",
        publicId: "admin-public-id",
        password: "$2a$10$...", // hash de "senha123" (opcional)
      }
    })
    console.log("Usuário admin criado")
  }

  const exampleFrames = [
    {
      name: "Moldura Dourada",
      description: "Uma moldura elegante com detalhes dourados",
      imageUrl: "/frames/dourada.png",
      thumbnailUrl: "/frames/dourada-thumb.png",
      category: "PROFILE_PICTURE",
      rarity: "RARO",
      stock: 10,
      priceCoins: 200,
      createdBy: adminUser.id,
    },
    {
      name: "Moldura Neon",
      description: "Efeito neon futurista",
      imageUrl: "/frames/neon.png",
      thumbnailUrl: "/frames/neon-thumb.png",
      category: "PROFILE_PICTURE",
      rarity: "EPICO",
      stock: 5,
      priceCoins: 500,
      createdBy: adminUser.id,
    },
    {
      name: "Moldura Mística",
      description: "Brilho mágico e misterioso",
      imageUrl: "/frames/mistica.png",
      thumbnailUrl: "/frames/mistica-thumb.png",
      category: "PROFILE_PICTURE",
      rarity: "LENDARIO",
      stock: 2,
      priceCoins: 1000,
      createdBy: adminUser.id,
    },
  ]

  for (const frame of exampleFrames) {
    const existing = await prisma.cosmetic_frame.findFirst({
      where: { name: frame.name }
    })
    
    if (existing) {
      await prisma.cosmetic_frame.update({
        where: { id: existing.id },
        data: frame,
      })
    } else {
      await prisma.cosmetic_frame.create({ data: frame })
    }
    console.log(`Moldura: ${frame.name} (${frame.rarity}) - ${frame.priceCoins} moedas`)
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })