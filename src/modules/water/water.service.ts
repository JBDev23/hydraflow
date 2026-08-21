import { prisma } from '../../prisma/prisma';
import {
  calculateXpGain,
  processLevelUp,
  getXpRequiredForLevel,
  processLevelDown,
  calculateNewStreak,
} from '../../lib/gamification';
import { checkAndUnlockAchievements } from '../../lib/achievements';
import {
  getCalendarDayRange,
  getLocalHour,
  getLocalYmd,
  toCalendarDateString,
} from '../../lib/dayRange';
import { DomainError } from '../common/domain-error';

const MAX_LOG_AMOUNT_ML = 5000;

export const parseAmount = (raw: unknown): number | null => {
  const amount = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) return null;
  if (amount <= 0 || amount > MAX_LOG_AMOUNT_ML) return null;
  return amount;
};

export { MAX_LOG_AMOUNT_ML };

export class WaterService {
  async getDayStats(userId: string, dateString: string, tzOffset: number) {
    const { start, end } = getCalendarDayRange(dateString, tzOffset);
    const labels = ['0', '3', '6', '9', '12', '15', '18', '21'];
    const values = new Array(8).fill(0);

    const logs = await prisma.waterLog.findMany({
      where: { userId, timestamp: { gte: start, lte: end } },
    });

    let totalAmount = 0;
    logs.forEach((log) => {
      totalAmount += log.amount;
      const hour = getLocalHour(log.timestamp, tzOffset);
      const index = Math.floor(hour / 3);
      if (values[index] !== undefined) values[index] += log.amount;
    });

    return { labels, values, start, end, metric: totalAmount };
  }

  async getWeekStats(userId: string, dateString: string, tzOffset: number) {
    const { year, month, day } = getCalendarDayRange(dateString, tzOffset);
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = (noonUtc.getUTCDay() + 6) % 7;

    const mondayDate = new Date(Date.UTC(year, month - 1, day));
    mondayDate.setUTCDate(mondayDate.getUTCDate() - dayOfWeek);
    const monY = mondayDate.getUTCFullYear();
    const monM = mondayDate.getUTCMonth() + 1;
    const monD = mondayDate.getUTCDate();
    const weekStart = getCalendarDayRange(
      `${monY}-${String(monM).padStart(2, '0')}-${String(monD).padStart(2, '0')}`,
      tzOffset
    );

    const sundayDate = new Date(Date.UTC(monY, monM - 1, monD));
    sundayDate.setUTCDate(sundayDate.getUTCDate() + 6);
    const sunY = sundayDate.getUTCFullYear();
    const sunM = sundayDate.getUTCMonth() + 1;
    const sunD = sundayDate.getUTCDate();
    const weekEnd = getCalendarDayRange(
      `${sunY}-${String(sunM).padStart(2, '0')}-${String(sunD).padStart(2, '0')}`,
      tzOffset
    );

    const start = weekStart.start;
    const end = weekEnd.end;
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const values = new Array(7).fill(0);

    const logs = await prisma.waterLog.findMany({
      where: { userId, timestamp: { gte: start, lte: end } },
    });

    let totalAmount = 0;
    logs.forEach((log) => {
      totalAmount += log.amount;
      const local = new Date(log.timestamp.getTime() - tzOffset * 60_000);
      let dayIndex = local.getUTCDay() - 1;
      if (dayIndex === -1) dayIndex = 6;
      if (values[dayIndex] !== undefined) values[dayIndex] += log.amount;
    });

    return { labels, values, start, end, metric: Math.round(totalAmount / 7) };
  }

  async getMonthStats(userId: string, dateString: string, tzOffset: number) {
    const { year, month } = getCalendarDayRange(dateString, tzOffset);
    const monthStart = getCalendarDayRange(
      `${year}-${String(month).padStart(2, '0')}-01`,
      tzOffset
    );

    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthEnd = getCalendarDayRange(
      `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      tzOffset
    );

    const start = monthStart.start;
    const end = monthEnd.end;
    const todayLocal = getLocalYmd(new Date(), tzOffset);
    const isCurrentMonth = todayLocal.year === year && todayLocal.month === month;
    const daysToCount = isCurrentMonth ? todayLocal.day : lastDay;

    const labels = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5'];
    const values = new Array(5).fill(0);

    const logs = await prisma.waterLog.findMany({
      where: { userId, timestamp: { gte: start, lte: end } },
    });

    let totalAmount = 0;
    logs.forEach((log) => {
      totalAmount += log.amount;
      const { day } = getLocalYmd(log.timestamp, tzOffset);
      let weekIndex = Math.floor((day - 1) / 7);
      if (weekIndex > 4) weekIndex = 4;
      if (values[weekIndex] !== undefined) values[weekIndex] += log.amount;
    });

    return {
      labels,
      values: values.map((val) => parseFloat((val / 1000).toFixed(1))),
      start,
      end,
      metric: Math.round(totalAmount / (daysToCount || 1)),
    };
  }

  async logWater(userId: string, amount: number, tzOffset: number) {
    const { start, end } = getCalendarDayRange(undefined, tzOffset);

    const result = await prisma.$transaction(async (tx) => {
      const userProfile = await tx.profile.findUnique({ where: { userId } });
      const dailyGoal = userProfile?.dailyGoal || 2000;

      const currentAggregation = await tx.waterLog.aggregate({
        _sum: { amount: true },
        where: { userId, timestamp: { gte: start, lte: end } },
      });
      const totalBeforeDrink = currentAggregation._sum.amount || 0;

      const log = await tx.waterLog.create({
        data: { userId, amount },
      });

      let stats = await tx.gameStats.findUnique({ where: { userId } });
      if (!stats) {
        stats = await tx.gameStats.create({
          data: {
            userId,
            level: 1,
            currentXp: 0,
            progress: 0,
            dropsBalance: 0,
            currentStreak: 0,
            totalGoalsReached: 0,
            totalVolume: 0,
          },
        });
      }

      const totalAfterDrink = totalBeforeDrink + amount;
      let goalIncrement = 0;
      if (totalBeforeDrink < dailyGoal && totalAfterDrink >= dailyGoal) {
        goalIncrement = 1;
      }

      const isGoalReached = goalIncrement === 1;
      const xpGained = calculateXpGain(amount);
      const progressResult = processLevelUp(stats.level, stats.currentXp, xpGained);
      const newStreak = calculateNewStreak(stats.currentStreak, stats.lastActiveDate, tzOffset);
      const isNewStreak = newStreak !== stats.currentStreak;

      const updatedStats = await tx.gameStats.update({
        where: { userId },
        data: {
          level: progressResult.newLevel,
          currentXp: progressResult.newXp,
          progress: progressResult.newProgress,
          dropsBalance: { increment: progressResult.dropsAwarded },
          totalGoalsReached: { increment: goalIncrement },
          currentStreak: newStreak,
          lastActiveDate: new Date(),
          totalVolume: { increment: amount },
        },
      });

      const { newUnlocks, totalCount } = await checkAndUnlockAchievements(
        tx,
        userId,
        updatedStats
      );

      return {
        log,
        updatedStats,
        progressResult,
        xpGained,
        newUnlocks,
        totalCount,
        isGoalReached,
        isNewStreak,
      };
    });

    return {
      logged: result.log,
      gamification: {
        xpGained: result.xpGained,
        leveledUp: result.progressResult.didLevelUp,
        newLevel: result.progressResult.newLevel,
        dropsBalance: result.updatedStats.dropsBalance,
        dropsEarned: result.progressResult.dropsAwarded,
        currentXp: result.updatedStats.currentXp,
        xpToNextLevel: getXpRequiredForLevel(result.updatedStats.level),
        progress: result.updatedStats.progress,
        currentStreak: result.updatedStats.currentStreak,
        totalGoalsReached: result.updatedStats.totalGoalsReached,
        totalVolume: result.updatedStats.totalVolume,
        newAchievements: result.newUnlocks,
        achievementsCount: result.totalCount,
        isNewStreak: result.isNewStreak,
        isGoalReached: result.isGoalReached,
      },
    };
  }

  async getDailyMetrics(userId: string, date: string | undefined, tzOffset: number) {
    const { start, end } = getCalendarDayRange(date, tzOffset);
    const aggregations = await prisma.waterLog.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        timestamp: { gte: start, lte: end },
      },
    });

    return {
      date: toCalendarDateString(start, tzOffset),
      total: aggregations._sum.amount || 0,
    };
  }

  async revertLog(userId: string, tzOffset: number) {
    const { start } = getCalendarDayRange(undefined, tzOffset);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const userProfile = await tx.profile.findUnique({ where: { userId } });
        const dailyGoal = userProfile?.dailyGoal || 2000;

        const currentAggregation = await tx.waterLog.aggregate({
          _sum: { amount: true },
          where: { userId, timestamp: { gte: start } },
        });
        const totalBeforeDelete = currentAggregation._sum.amount || 0;

        const lastLog = await tx.waterLog.findFirst({
          where: { userId, timestamp: { gte: start } },
          orderBy: { timestamp: 'desc' },
        });

        if (!lastLog) {
          throw new DomainError('NO_LOGS_TODAY', 'No logs today', 400);
        }

        const totalAfterDelete = totalBeforeDelete - lastLog.amount;
        let goalDecrement = 0;
        if (totalBeforeDelete >= dailyGoal && totalAfterDelete < dailyGoal) {
          goalDecrement = 1;
        }

        await tx.waterLog.delete({ where: { id: lastLog.id } });

        const remainingLogsToday = await tx.waterLog.count({
          where: { userId, timestamp: { gte: start } },
        });

        const stats = await tx.gameStats.findUnique({ where: { userId } });
        if (!stats) throw new DomainError('STATS_NOT_FOUND', 'Stats not found', 404);

        const xpToDeduct = calculateXpGain(lastLog.amount);
        const regressionResult = processLevelDown(stats.level, stats.currentXp, xpToDeduct);

        let newStreak = stats.currentStreak;
        let newLastActiveDate = stats.lastActiveDate;

        if (remainingLogsToday === 0) {
          newStreak = Math.max(0, stats.currentStreak - 1);
          const previousLog = await tx.waterLog.findFirst({
            where: { userId, timestamp: { lt: start } },
            orderBy: { timestamp: 'desc' },
          });
          newLastActiveDate = previousLog ? previousLog.timestamp : null;
        }

        const updatedStats = await tx.gameStats.update({
          where: { userId },
          data: {
            level: regressionResult.newLevel,
            currentXp: regressionResult.newXp,
            progress: regressionResult.newProgress,
            dropsBalance: { decrement: regressionResult.dropsToDeduct },
            totalGoalsReached: Math.max(0, stats.totalGoalsReached - goalDecrement),
            currentStreak: newStreak,
            lastActiveDate: newLastActiveDate,
            totalVolume: { decrement: lastLog.amount },
          },
        });

        return { lastLog, updatedStats, xpToDeduct };
      });

      return {
        deletedAmount: result.lastLog.amount,
        gamification: {
          currentXp: result.updatedStats.currentXp,
          level: result.updatedStats.level,
          progress: result.updatedStats.progress,
          dropsBalance: result.updatedStats.dropsBalance,
          currentStreak: result.updatedStats.currentStreak,
          goalsReached: result.updatedStats.totalGoalsReached,
          totalGoalsReached: result.updatedStats.totalGoalsReached,
          totalVolume: result.updatedStats.totalVolume,
        },
        message: 'Last log deleted',
      };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw error;
    }
  }

  async getRangeMetrics(
    userId: string,
    startDate: string,
    endDate: string,
    tzOffset: number
  ) {
    const { start } = getCalendarDayRange(startDate, tzOffset);
    const { end } = getCalendarDayRange(endDate, tzOffset);

    const logs = await prisma.waterLog.findMany({
      where: {
        userId,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: 'asc' },
    });

    const dailyTotals: Record<string, number> = {};
    logs.forEach((log) => {
      const dateString = toCalendarDateString(log.timestamp, tzOffset);
      dailyTotals[dateString] = (dailyTotals[dateString] || 0) + log.amount;
    });

    return dailyTotals;
  }

  async getStatsGraph(
    userId: string,
    mode: string,
    refDate: string,
    tzOffset: number
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(refDate)) {
      throw new DomainError('INVALID_DATE', 'Invalid date format (use YYYY-MM-DD)', 400);
    }

    let result;
    switch (mode) {
      case 'day':
        result = await this.getDayStats(userId, refDate, tzOffset);
        break;
      case 'week':
        result = await this.getWeekStats(userId, refDate, tzOffset);
        break;
      case 'month':
        result = await this.getMonthStats(userId, refDate, tzOffset);
        break;
      default:
        throw new DomainError(
          'INVALID_MODE',
          "Invalid mode. Use 'day', 'week' or 'month'",
          400
        );
    }

    return {
      labels: result.labels,
      values: result.values,
      metric: result.metric,
      startDate: result.start.toISOString(),
      endDate: result.end.toISOString(),
    };
  }
}

export const waterService = new WaterService();
