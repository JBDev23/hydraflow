const XP_PER_ML = 0.1;
const BASE_XP = 100;
const MULTIPLIER = 2;
const DROPS_PER_LEVEL = 5;

export const calculateXpGain = (amountMl: number): number => {
  return Math.floor(amountMl * XP_PER_ML);
};

export const getXpRequiredForLevel = (level: number): number => {
  return Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1));
};

export const calculateProgress = (currentLevel: number, currentXp: number): number => {
  let xpRequired = getXpRequiredForLevel(currentLevel);
  if (xpRequired === 0) return 0;
  return Math.floor((currentXp * 100) / xpRequired);
};

export const processLevelUp = (currentLevel: number, currentXp: number, xpGained: number) => {
  let newLevel = currentLevel;
  let newXp = currentXp + xpGained;
  let dropsAwarded = 0;
  let didLevelUp = false;

  while (true) {
    const xpRequired = getXpRequiredForLevel(newLevel);

    if (newXp >= xpRequired) {
      newXp -= xpRequired;
      newLevel++;
      dropsAwarded += DROPS_PER_LEVEL;
      didLevelUp = true;
    } else {
      break;
    }
  }

  let newProgress = calculateProgress(newLevel, newXp);

  return {
    newLevel,
    newXp,
    newProgress,
    dropsAwarded,
    didLevelUp,
  };
};

export const processLevelDown = (currentLevel: number, currentXp: number, xpToDeduct: number) => {
  let newLevel = currentLevel;
  let newXp = currentXp - xpToDeduct;
  let dropsToDeduct = 0;

  // Mientras la XP sea negativa y no estemos en nivel 1, bajamos nivel
  while (newXp < 0 && newLevel > 1) {
    newLevel--;
    const xpRequired = getXpRequiredForLevel(newLevel);
    newXp += xpRequired; // Recuperamos la XP base del nivel anterior
    dropsToDeduct += DROPS_PER_LEVEL; // Quitamos los drops ganados
  }

  // Seguridad para nivel 1: no bajar de 0 XP
  if (newXp < 0) newXp = 0;

  const newProgress = calculateProgress(newLevel, newXp);

  return {
    newLevel,
    newXp,
    newProgress,
    dropsToDeduct,
  };
};

import { getCalendarDayRange, toCalendarDateString } from './dayRange';

/** Diff in calendar days between two instants in the user's timezone */
const calendarDayDiff = (later: Date, earlier: Date, tzOffsetMinutes = 0): number => {
  const a = toCalendarDateString(later, tzOffsetMinutes);
  const b = toCalendarDateString(earlier, tzOffsetMinutes);
  const startA = getCalendarDayRange(a, tzOffsetMinutes).start.getTime();
  const startB = getCalendarDayRange(b, tzOffsetMinutes).start.getTime();
  return Math.round((startA - startB) / (1000 * 60 * 60 * 24));
};

export const calculateNewStreak = (
  currentStreak: number,
  lastActiveDate: Date | null,
  tzOffsetMinutes = 0,
): number => {
  if (!lastActiveDate) return 1;

  const diffDays = calendarDayDiff(new Date(), lastActiveDate, tzOffsetMinutes);

  if (diffDays === 0) {
    return currentStreak; // Ya bebió hoy
  } else if (diffDays === 1) {
    return currentStreak + 1; // Bebió ayer
  } else {
    return 1; // Saltó un día o más
  }
};

export const checkStreakBreak = (
  currentStreak: number,
  lastActiveDate: Date | null,
  tzOffsetMinutes = 0,
): number => {
  if (!lastActiveDate) return 0;

  const diffDays = calendarDayDiff(new Date(), lastActiveDate, tzOffsetMinutes);

  if (diffDays > 1) {
    return 0;
  }

  return currentStreak;
};
