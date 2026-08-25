import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog() {
    return this.prisma.catalogAchievement.findMany();
  }
}
