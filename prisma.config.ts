// prisma.config.ts
// Configuração do Prisma CLI: schema, migrations, comando de seed e URL do banco (DATABASE_URL
// obrigatória).

import { defineConfig } from 'prisma/config';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no arquivo .env');
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: DATABASE_URL,
  },
});
