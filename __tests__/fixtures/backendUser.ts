import type { BackendUser } from '../../types';

export const minimalBackendUser: BackendUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  items: [],
  achievements: [],
};

export const backendUserWithItems: BackendUser = {
  ...minimalBackendUser,
  items: [
    { itemId: 'sunGlasses', isEquipped: true },
    { itemId: 'hat', isEquipped: false },
    { itemId: 'scarf', isEquipped: true },
  ],
};

export const backendUserWithAchievements: BackendUser = {
  ...minimalBackendUser,
  achievements: [
    { achievementId: 'FIRST_DRINK', unlockedAt: '2026-01-15T10:00:00Z' },
    { achievementId: 'STREAK_3', unlockedAt: '2026-01-20T08:30:00Z' },
  ],
};

export const backendUserCompleteBiometrics: BackendUser = {
  ...minimalBackendUser,
  profile: {
    weight: 70,
    height: 175,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    dailyGoal: 2500,
  },
  settings: {
    wakeTime: { hours: 7, minutes: 30 },
    sleepTime: { hours: 23, minutes: 0 },
    preferences: {
      unitDist: 'cm',
      unitWeight: 'kg',
      soundEffects: true,
      volume: 80,
      vibration: true,
      theme: 'dark',
      language: 'es',
    },
    notifications: {
      enabled: true,
      frequency: 'smart',
      sound: 'drop',
    },
  },
  gameStats: {
    level: 3,
    currentXp: 45,
    progress: 45,
    dropsBalance: 25,
    skinsCount: 2,
    currentStreak: 5,
    totalGoalsReached: 10,
    achievementsCount: 2,
    totalVolume: 15000,
  },
  items: [{ itemId: 'sunGlasses', isEquipped: true }],
  achievements: [{ achievementId: 'FIRST_DRINK', unlockedAt: '2026-01-01T00:00:00Z' }],
};

export const backendUserIncompleteBiometrics: BackendUser = {
  ...minimalBackendUser,
  profile: {
    weight: 70,
    height: 0,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    dailyGoal: 0,
  },
  settings: {
    wakeTime: { hours: 8, minutes: 0 },
    sleepTime: null,
  },
};

export const backendUserSoundEffectsZero: BackendUser = {
  ...minimalBackendUser,
  settings: {
    preferences: {
      soundEffects: 0 as unknown as boolean,
    },
  },
};
