import './src/load-env';
import { defineConfig } from 'prisma/config';

// prisma generate (postinstall / CI) must not require secrets.
// Migrations and runtime still use real DIRECT_URL / DATABASE_URL.
const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
  },
});
