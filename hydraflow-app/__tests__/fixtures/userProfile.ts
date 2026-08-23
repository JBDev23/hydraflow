import type { UserProfile, UserProfilePatch } from '../../types';
import { INITIAL_USER_PROFILE } from '../../services/profileMapping';

export const fullUserProfile: UserProfile = {
  ...INITIAL_USER_PROFILE,
  name: 'Jane Doe',
  email: 'jane@example.com',
  age: 28,
  weight: 65,
  height: 168,
  gender: 'female',
  activity: 'active',
  goal: 2200,
  onboardingCompleted: true,
  stats: {
    level: 2,
    currentXp: 80,
    progress: 80,
    achievementsCount: 1,
    skinsCount: 3,
    dropsBalance: 15,
    totalGoalsReached: 5,
    currentStreak: 3,
    totalVolume: 8000,
  },
  skins: {
    owned: ['sunGlasses', 'hat'],
    equipped: ['sunGlasses'],
  },
  achievements: [{ id: 'FIRST_DRINK', date: '2026-01-10' }],
};

export const partialProfilePatch: UserProfilePatch = {
  name: 'Updated Name',
  goal: 3000,
  preferences: { theme: 'dark' },
};

export const statsPatch: UserProfilePatch = {
  stats: {
    level: 5,
    dropsBalance: 100,
    currentStreak: 10,
    currentXp: 999,
    totalVolume: 50000,
  },
};

export const skinsPatch: UserProfilePatch = {
  skins: {
    owned: ['sunGlasses', 'hat', 'scarf', 'boots'],
    equipped: ['hat'],
  },
};

export const profileWithIgnoredFields: UserProfilePatch = {
  email: 'should-not-sync@example.com',
  achievements: [{ id: 'LEVEL_5', date: '2026-02-01' }],
  skins: { owned: ['sunGlasses'], equipped: [] },
  name: 'Syncable Name',
};
