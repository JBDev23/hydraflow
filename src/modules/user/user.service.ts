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

type UpdateProfileInput = Record<string, unknown>;

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
        tzOffset,
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
        user.settings.preferences as Record<string, unknown>,
      );
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const activityLevel = data.activity as string | undefined;
    const dailyGoal = safeInt(data.goal);
    const stats = data.stats as Record<string, unknown> | undefined;
    const dropsBalance = safeInt(stats?.dropsBalance);
    const currentStreak = safeInt(stats?.currentStreak);

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: (data.name as string | undefined) || undefined,
        profile: {
          upsert: {
            create: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: (data.gender as string | undefined) || undefined,
              activityLevel: activityLevel || undefined,
              dailyGoal: dailyGoal || 2000,
            },
            update: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: (data.gender as string | undefined) || undefined,
              activityLevel: activityLevel || undefined,
              dailyGoal: dailyGoal,
            },
          },
        },
        settings: {
          upsert: {
            create: {
              notifications:
                (data.notifications as typeof DEFAULT_NOTIFICATIONS | undefined) ||
                DEFAULT_NOTIFICATIONS,
              preferences: (data.preferences
                ? normalizePreferences(data.preferences as Record<string, unknown>)
                : DEFAULT_PREFERENCES) as object,
              wakeTime: (data.wakeTime as string | undefined) || undefined,
              sleepTime: (data.sleepTime as string | undefined) || undefined,
            },
            update: {
              notifications:
                (data.notifications as typeof DEFAULT_NOTIFICATIONS | undefined) || undefined,
              preferences: data.preferences
                ? (normalizePreferences(data.preferences as Record<string, unknown>) as object)
                : undefined,
              wakeTime: (data.wakeTime as string | undefined) || undefined,
              sleepTime: (data.sleepTime as string | undefined) || undefined,
            },
          },
        },
        gameStats: {
          upsert: {
            create: {
              level: safeInt(stats?.level) || 1,
              dropsBalance: dropsBalance ?? 0,
              currentStreak: currentStreak ?? 0,
            },
            update: {
              level: safeInt(stats?.level),
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
