// lib/prisma.ts
// Cliente Prisma compartilhado sobre o driver pg (adapter PrismaPg), reutilizado entre hot
// reloads em desenvolvimento.

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/** Pool de conexões do PostgreSQL usado pelo adapter do Prisma. */
export const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
});
const adapter = new PrismaPg(pool);

/** Instância do Prisma criada por este módulo. */
export const baseClient = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient<{ adapter: PrismaPg }> | undefined;
};

/**
 * Cliente usado pela aplicação; em desenvolvimento fica em globalThis para sobreviver ao hot
 * reload.
 */
export const prisma = globalForPrisma.prisma ?? baseClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
