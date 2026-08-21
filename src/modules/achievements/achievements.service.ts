import { prisma } from '../../prisma/prisma';

export class AchievementsService {
  async getCatalog() {
    return prisma.catalogAchievement.findMany();
  }
}

export const achievementsService = new AchievementsService();
