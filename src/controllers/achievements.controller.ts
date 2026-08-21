import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { achievementsService } from '../modules/achievements/achievements.service';

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const achievements = await achievementsService.getCatalog();
    return res.json({ success: true, achievements });
  } catch (error) {
    console.error('Get Achievements Error:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};
