import type {
  BackendGameStats,
  BackendUser,
  GameStats,
  UserProfile,
  UserProfilePatch,
} from '../types';

export const DEFAULT_STATS: GameStats = {
  level: 1,
  currentXp: 0,
  progress: 0,
  achievementsCount: 0,
  skinsCount: 1,
  dropsBalance: 10,
  totalGoalsReached: 0,
  currentStreak: 0,
  totalVolume: 0,
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  age: 25,
  weight: 70,
  gender: 'male',
  height: 170,
  activity: 'sedentary',
  wakeTime: { hours: 8, minutes: 0 },
  sleepTime: { hours: 23, minutes: 0 },
  goal: 2000,
  onboardingCompleted: false,
  stats: { ...DEFAULT_STATS },
  skins: {
    owned: ['sunGlasses'],
    equipped: [],
  },
  notifications: {
    enabled: true,
    frequency: 'smart',
    sound: 'drop',
  },
  preferences: {
    unitDist: 'cm',
    unitWeight: 'kg',
    soundEffects: true,
    volume: 50,
    vibration: true,
    theme: 'light',
    language: 'es',
  },
};

export const mapGameStats = (gameStats: BackendGameStats): GameStats => {
  if (!gameStats) return { ...DEFAULT_STATS };

  return {
    level: gameStats.level ?? DEFAULT_STATS.level,
    currentXp: gameStats.currentXp ?? DEFAULT_STATS.currentXp,
    progress: gameStats.progress ?? DEFAULT_STATS.progress,
    dropsBalance: gameStats.dropsBalance ?? DEFAULT_STATS.dropsBalance,
    skinsCount: gameStats.skinsCount ?? DEFAULT_STATS.skinsCount,
    currentStreak: gameStats.currentStreak ?? DEFAULT_STATS.currentStreak,
    totalGoalsReached: gameStats.totalGoalsReached ?? DEFAULT_STATS.totalGoalsReached,
    achievementsCount: gameStats.achievementsCount ?? DEFAULT_STATS.achievementsCount,
    totalVolume: gameStats.totalVolume ?? DEFAULT_STATS.totalVolume,
  };
};

/** Coerce wake/sleep from API/cache; rejects corrupted "[object Object]" strings. */
export const normalizeTimeOfDay = (
  value: unknown,
  fallback: UserProfile['wakeTime'],
): UserProfile['wakeTime'] => {
  if (!value || typeof value !== 'object') return { ...fallback };
  const hours = Number((value as { hours?: unknown }).hours);
  const minutes = Number((value as { minutes?: unknown }).minutes);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return { ...fallback };
  return {
    hours: Math.max(0, Math.min(23, Math.trunc(hours))),
    minutes: Math.max(0, Math.min(59, Math.trunc(minutes))),
  };
};

export const normalizeLocalProfile = (
  profile: UserProfile | Record<string, unknown> | null | undefined,
): UserProfile | null | undefined => {
  if (!profile || typeof profile !== 'object') return profile as null | undefined;

  const p = profile as Partial<UserProfile>;

  return {
    ...(profile as UserProfile),
    wakeTime: normalizeTimeOfDay(p.wakeTime, INITIAL_USER_PROFILE.wakeTime),
    sleepTime: normalizeTimeOfDay(p.sleepTime, INITIAL_USER_PROFILE.sleepTime),
    preferences: {
      ...INITIAL_USER_PROFILE.preferences,
      ...(p.preferences || {}),
    },
    skins: {
      owned: p.skins?.owned ?? [...INITIAL_USER_PROFILE.skins.owned],
      equipped: p.skins?.equipped ?? [],
    },
    notifications: {
      ...INITIAL_USER_PROFILE.notifications,
      ...(p.notifications || {}),
    },
    stats: { ...DEFAULT_STATS, ...(p.stats || {}) },
  };
};

export const resolveOnboardingCompleted = (backendUser: BackendUser): boolean => {
  const raw = (backendUser.settings?.preferences || {}) as Record<string, unknown>;
  return raw.onboardingCompleted === true;
};

export const mapBackendToFrontend = (backendUser: BackendUser): UserProfile => {
  const owned = backendUser.items.map((i) => i.itemId);
  const equipped = backendUser.items.filter((i) => i.isEquipped).map((i) => i.itemId);

  const unlockedAchievements =
    backendUser.achievements?.map((a) => ({
      id: a.achievementId,
      date: a.unlockedAt,
    })) || [];

  const rawPrefs = (backendUser.settings?.preferences || {}) as Record<string, unknown>;
  const { onboardingCompleted: _ignored, ...restPrefs } = rawPrefs;
  const preferences = {
    ...INITIAL_USER_PROFILE.preferences,
    ...restPrefs,
    soundEffects: rawPrefs.soundEffects !== undefined ? Boolean(rawPrefs.soundEffects) : true,
  } as UserProfile['preferences'];

  return {
    name: backendUser.name ?? '',
    email: backendUser.email,
    weight: backendUser.profile?.weight || 0,
    height: backendUser.profile?.height || 0,
    age: backendUser.profile?.age || 0,
    gender: backendUser.profile?.gender || INITIAL_USER_PROFILE.gender,
    activity: backendUser.profile?.activityLevel || 'sedentary',
    goal: backendUser.profile?.dailyGoal || 2000,
    wakeTime: normalizeTimeOfDay(backendUser.settings?.wakeTime, INITIAL_USER_PROFILE.wakeTime),
    sleepTime: normalizeTimeOfDay(backendUser.settings?.sleepTime, INITIAL_USER_PROFILE.sleepTime),
    stats: mapGameStats(backendUser.gameStats),
    notifications: (backendUser.settings?.notifications || {
      ...INITIAL_USER_PROFILE.notifications,
    }) as UserProfile['notifications'],
    preferences,
    skins: { owned, equipped },
    achievements: unlockedAchievements,
    onboardingCompleted: resolveOnboardingCompleted(backendUser),
  };
};

export const preferencesWithOnboardingFlag = (
  preferences: UserProfile['preferences'],
  onboardingCompleted: boolean,
): UserProfile['preferences'] & { onboardingCompleted: boolean } => ({
  ...preferences,
  onboardingCompleted,
});

export const createEmptyProfile = (): UserProfile => ({
  ...INITIAL_USER_PROFILE,
  stats: { ...DEFAULT_STATS },
  skins: {
    owned: [...INITIAL_USER_PROFILE.skins.owned],
    equipped: [],
  },
  notifications: { ...INITIAL_USER_PROFILE.notifications },
  preferences: { ...INITIAL_USER_PROFILE.preferences },
  wakeTime: { ...INITIAL_USER_PROFILE.wakeTime },
  sleepTime: { ...INITIAL_USER_PROFILE.sleepTime },
});

export const mergeProfilePatch = (prev: UserProfile, newData: UserProfilePatch): UserProfile => {
  let updatedProfile: UserProfile = { ...prev, ...newData } as UserProfile;

  if (newData.stats) {
    updatedProfile = {
      ...updatedProfile,
      stats: { ...prev.stats, ...newData.stats },
    };
  }

  if (newData.skins?.owned) {
    updatedProfile = {
      ...updatedProfile,
      stats: { ...updatedProfile.stats, skinsCount: newData.skins.owned.length },
    };
  }

  return updatedProfile;
};

/** Default temperate indoor residential environment (Yamada WT model). */
const YAMADA_TEMP_C = 20;
const YAMADA_HUMIDITY = 50;
const YAMADA_ALTITUDE_M = 100;
const YAMADA_HDI = 0;
/** Fraction of water turnover that comes from beverages (UI drink goal). */
const BEVERAGE_FRACTION = 0.68;

/** PAL mapped to app activity scale (1.50–2.15). */
const ACTIVITY_PAL: Record<string, number> = {
  sedentary: 1.5,
  moderate: 1.75,
  active: 2.0,
  highActive: 2.15,
};

/**
 * Ideal daily beverage goal (ml) from Yamada water-turnover regression.
 * Drink goal = WT × 0.68, rounded to nearest 100 ml.
 */
export const calculateIdealGoal = (
  profile: Pick<UserProfile, 'weight' | 'age' | 'gender' | 'activity'>,
): number => {
  const weight = parseFloat(String(profile.weight)) || 0;
  const age = parseFloat(String(profile.age)) || 0;
  const pal = ACTIVITY_PAL[profile.activity] ?? ACTIVITY_PAL.sedentary;
  const sex = profile.gender === 'male' ? 1 : profile.gender === 'female' ? 0 : 0.5;
  const athlete = profile.activity === 'highActive' ? 1 : 0;

  const waterTurnover =
    1076 * pal +
    14.34 * weight +
    374.9 * sex +
    5.823 * YAMADA_HUMIDITY +
    1070 * athlete +
    104.6 * YAMADA_HDI +
    0.4726 * YAMADA_ALTITUDE_M -
    0.3529 * age ** 2 +
    24.78 * age +
    1.865 * YAMADA_TEMP_C ** 2 -
    19.66 * YAMADA_TEMP_C -
    713.1;

  return Math.round((waterTurnover * BEVERAGE_FRACTION) / 100) * 100;
};
