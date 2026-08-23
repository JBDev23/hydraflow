import type { PrismaService } from '../src/prisma/prisma.service';
import { getSeedClient } from './seed-client';

const SKIN_LIST = [
  {
    id: 'sunGlasses',
    category: 'glasses',
    name: { es: 'Gafas de sol', en: 'Sunglasses' },
    price: 5,
  },
  {
    id: 'pinkGlasses',
    category: 'glasses',
    name: { es: 'Gafas rosas', en: 'Pink Glasses' },
    price: 8,
  },
  { id: 'hat1', category: 'hat', name: { es: 'Gorro', en: 'Beanie' }, price: 8 },
  { id: 'hat2', category: 'hat', name: { es: 'Sombrero', en: 'Hat' }, price: 10 },
  { id: 'bowTie', category: 'neck', name: { es: 'Pajarita', en: 'Bow Tie' }, price: 12 },
  { id: 'ribbon', category: 'hat', name: { es: 'Lazo', en: 'Ribbon' }, price: 12 },
];

const ACHIEVEMENTS = [
  {
    id: 'first_sip',
    icon: 'droplet',
    condition: 'FIRST_DRINK',
    name: { es: 'Hydra', en: 'Hydra' },
    description: { es: 'Registra tu primer vaso de agua', en: 'Log your first glass of water' },
  },
  {
    id: 'goal_getter',
    icon: 'egg',
    condition: 'GOAL_REACHED_1',
    name: { es: 'El Iniciado', en: 'The Initiate' },
    description: {
      es: 'Completa tu meta diaria por primera vez',
      en: 'Complete your daily goal for the first time',
    },
  },
  {
    id: 'streak_3',
    icon: 'fire',
    condition: 'STREAK_3',
    name: { es: 'En Racha', en: 'On Fire' },
    description: { es: 'Mantén una racha de 3 días', en: 'Maintain a 3-day streak' },
  },
  {
    id: 'level_5',
    icon: 'medal',
    condition: 'LEVEL_5',
    name: { es: 'Veterano', en: 'Veteran' },
    description: { es: 'Alcanza el nivel 5', en: 'Reach level 5' },
  },
  {
    id: 'total_10l',
    icon: 'water',
    condition: 'TOTAL_10L',
    name: { es: 'Camello', en: 'Camel' },
    description: { es: 'Bebe un total de 10 Litros', en: 'Drink a total of 10 Liters' },
  },
];

export async function seedCatalogItems(prisma: PrismaService) {
  console.log(`Sembrando el Catálogo...`);
  for (const skin of SKIN_LIST) {
    await prisma.catalogItem.upsert({
      where: { id: skin.id },
      update: {},
      create: {
        id: skin.id,
        category: skin.category,
        name: skin.name,
        price: skin.price,
        isActive: true,
      },
    });
    console.log(`  Item listo: ${skin.id}`);
  }
}

export async function seedAchievements(prisma: PrismaService) {
  console.log(`Sembrando Logros...`);
  for (const ach of ACHIEVEMENTS) {
    await prisma.catalogAchievement.upsert({
      where: { id: ach.id },
      update: {
        icon: ach.icon,
        condition: ach.condition,
        name: ach.name,
        description: ach.description,
      },
      create: {
        id: ach.id,
        icon: ach.icon,
        condition: ach.condition,
        name: ach.name,
        description: ach.description,
      },
    });
    console.log(`  Logro creado/actualizado: ${ach.name.es}`);
  }
}

export async function seedDatabase(prisma: PrismaService) {
  await seedCatalogItems(prisma);
  await seedAchievements(prisma);
  console.log(`Base de datos sembrada correctamente.`);
}

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
