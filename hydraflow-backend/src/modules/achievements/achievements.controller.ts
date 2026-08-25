import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('catalog')
  async getAchievements() {
    try {
      const achievements = await this.achievementsService.getCatalog();
      return { success: true, achievements };
    } catch (error) {
      console.error('Get Achievements Error:', error);
      throw new HttpException(
        { error: 'Failed to fetch achievements' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
