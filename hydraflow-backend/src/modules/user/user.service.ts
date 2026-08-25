import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma';
import { checkStreakBreak } from '../../lib/gamification';
import { DEFAULT_PREFERENCES, normalizePreferences } from '../../lib/preferences';
import { DomainError } from '../common/domain-error';
import type { UpdateProfileDto } from './dto/update-profile.dto';

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

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string, tzOffset: number) {
    const user = await this.prisma.user.findUnique({
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
        const updatedStats = await this.prisma.gameStats.update({
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

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const activityLevel = data.activity;
    const dailyGoal = safeInt(data.goal);
    const stats = data.stats;
    const dropsBalance = safeInt(stats?.dropsBalance);
    const currentStreak = safeInt(stats?.currentStreak);

    let preferencesToSave: object | undefined;
    if (data.preferences) {
      const existingSettings = await this.prisma.settings.findUnique({
        where: { userId },
        select: { preferences: true },
      });
      const existingPrefs =
        existingSettings?.preferences && typeof existingSettings.preferences === 'object'
          ? (existingSettings.preferences as Record<string, unknown>)
          : {};
      // Merge with existing so keys like onboardingCompleted are not wiped by partial updates.
      preferencesToSave = normalizePreferences({
        ...existingPrefs,
        ...(data.preferences as Record<string, unknown>),
      }) as object;
    }

    return this.prisma.user.update({
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
              notifications:
                (data.notifications as typeof DEFAULT_NOTIFICATIONS | undefined) ||
                DEFAULT_NOTIFICATIONS,
              preferences: preferencesToSave ?? (DEFAULT_PREFERENCES as object),
              wakeTime: (data.wakeTime as object) || undefined,
              sleepTime: (data.sleepTime as object) || undefined,
            },
            update: {
              notifications:
                (data.notifications as typeof DEFAULT_NOTIFICATIONS | undefined) || undefined,
              preferences: preferencesToSave,
              wakeTime: (data.wakeTime as object) || undefined,
              sleepTime: (data.sleepTime as object) || undefined,
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
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async exportUserData(userId: string) {
    return this.prisma.waterLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
