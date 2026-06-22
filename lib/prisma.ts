// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Configuração do Driver Adapter (PostgreSQL)
export const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
});
const adapter = new PrismaPg(pool);

// 2. Instância Base do Prisma
export const baseClient = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient<{ adapter: PrismaPg }> | undefined;
};

// 4. Exportar o cliente (usando baseClient diretamente)
export const prisma = globalForPrisma.prisma ?? baseClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
