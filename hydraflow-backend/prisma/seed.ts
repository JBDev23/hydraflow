import { seedDatabase } from '../src/lib/seed-database';
import { getSeedClient } from './seed-client';

async function main() {
  const prisma = getSeedClient();
  await seedDatabase(prisma);
  return prisma;
}

main()
  .then(async (prisma) => {
    await prisma.disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await getSeedClient().disconnect();
    process.exit(1);
  });
