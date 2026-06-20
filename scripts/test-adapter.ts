// scripts/test-adapter-fixed.ts
import { prisma } from '../lib/prisma';

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
