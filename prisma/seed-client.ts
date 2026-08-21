import '../src/load-env';
import { createPrismaClient } from '../src/prisma/prisma.service';

/** Shared Prisma client for CLI seed scripts (adapter + DATABASE_URL). */
export function getSeedClient() {
  return createPrismaClient();
}
