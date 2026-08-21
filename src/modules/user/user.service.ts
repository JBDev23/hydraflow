import { prisma } from '../../prisma/prisma';
import { checkStreakBreak } from '../../lib/gamification';
import { DEFAULT_PREFERENCES, normalizePreferences } from '../../lib/preferences';
import { DomainError } from '../common/domain-error';

const DEFAULT_NOTIFICATIONS = {
  enabled: true,
  frequency: 'smart',
  sound: 'drop',
};

const safeFloat = (val: unknown) => {
  if (val === undefined || val === null || val === '') return undefined;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? undefined : parsed;
};

const safeInt = (val: unknown) => {
  if (val === undefined || val === null || val === '') return undefined;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? undefined : parsed;
};

export class UserService {
  async getProfile(userId: string, tzOffset: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
        gameStats: true,
        items: true,
        achievements: true,
      },
    });

    if (!user) {
      throw new DomainError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (user.gameStats) {
      const realStreak = checkStreakBreak(
        user.gameStats.currentStreak,
        user.gameStats.lastActiveDate,
        tzOffset
      );

      if (realStreak !== user.gameStats.currentStreak) {
        const updatedStats = await prisma.gameStats.update({
          where: { id: user.gameStats.id },
          data: { currentStreak: realStreak },
        });
        user.gameStats.currentStreak = updatedStats.currentStreak;
      }
    }

    if (user.settings?.preferences) {
      (user.settings as { preferences: unknown }).preferences = normalizePreferences(
        user.settings.preferences as Record<string, unknown>
      );
    }

    return user;
  }

  async updateProfile(userId: string, data: Record<string, any>) {
    const activityLevel = data.activity;
    const dailyGoal = safeInt(data.goal);
    const dropsBalance = safeInt(data.stats?.dropsBalance);
    const currentStreak = safeInt(data.stats?.currentStreak);

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || undefined,
        profile: {
          upsert: {
            create: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: data.gender || undefined,
              activityLevel: activityLevel || undefined,
              dailyGoal: dailyGoal || 2000,
            },
            update: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: data.gender || undefined,
              activityLevel: activityLevel || undefined,
              dailyGoal: dailyGoal,
            },
          },
        },
        settings: {
          upsert: {
            create: {
              notifications: data.notifications || DEFAULT_NOTIFICATIONS,
              preferences: (data.preferences
                ? normalizePreferences(data.preferences)
                : DEFAULT_PREFERENCES) as object,
              wakeTime: data.wakeTime || undefined,
              sleepTime: data.sleepTime || undefined,
            },
            update: {
              notifications: data.notifications || undefined,
              preferences: data.preferences
                ? (normalizePreferences(data.preferences) as object)
                : undefined,
              wakeTime: data.wakeTime || undefined,
              sleepTime: data.sleepTime || undefined,
            },
          },
        },
        gameStats: {
          upsert: {
            create: {
              level: safeInt(data.stats?.level) || 1,
              dropsBalance: dropsBalance ?? 0,
              currentStreak: currentStreak ?? 0,
            },
            update: {
              level: safeInt(data.stats?.level),
              dropsBalance,
              currentStreak,
            },
          },
        },
      },
    });
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
  }

  async exportUserData(userId: string) {
    return prisma.waterLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const userService = new UserService();
