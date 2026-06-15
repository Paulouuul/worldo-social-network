// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { syncToListing, removeFromElasticsearch } from './prisma-sync';

// 1. Configuração do Driver Adapter (PostgreSQL)
export const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
});
const adapter = new PrismaPg(pool);

// 2. Instância Base do Prisma (usada internamente para evitar loops e dependência circular)
export const baseClient = new PrismaClient({ adapter });

// 3. Criação do Cliente Estendido com os gatilhos do Elasticsearch
const createExtendedClient = () => {
  return baseClient.$extends({
    query: {
      cosmetic_listing: {
        async create({ args, query }) {
          const result = await query(args);
          if (result?.id) syncToListing(result.id).catch(console.error);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          if (result?.id) syncToListing(result.id).catch(console.error);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          if (result?.id) removeFromElasticsearch(result.id).catch(console.error);
          return result;
        },
        // Adicionar aviso para updateMany/deleteMany (opcional)
        async updateMany({ args, query }) {
          const result = await query(args);
          console.log(
            `!! [Auto-sync] updateMany não sincroniza automaticamente. Use update() individual.`,
          );
          return result;
        },
        async deleteMany({ args, query }) {
          const result = await query(args);
          console.log(
            `!! [Auto-sync] deleteMany não sincroniza automaticamente. Use delete() individual.`,
          );
          return result;
        },
      },
    },
  });
};

// 4. Gerenciamento do escopo Global (essencial para Next.js / recarregamento em desenvolvimento)
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
