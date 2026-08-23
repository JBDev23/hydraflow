import '../load-env';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Nest-ready Prisma wrapper: add @Injectable() + OnModuleInit/OnModuleDestroy later.
 * Runtime uses DATABASE_URL (pooled). CLI migrations use DIRECT_URL via prisma.config.ts.
 */
export function createPrismaClient(): PrismaService {
  return new PrismaService();
}

export class PrismaService extends PrismaClient {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    // pg is pinned to 8.18.x: adapter-pg can fan-out queries on one PoolClient
    // inside $transaction, which pg>=8.20 warns about (hard error in pg@9).
    // Remove the pin when Prisma ships serialized performIO on PgTransaction.
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async disconnect(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaService };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
