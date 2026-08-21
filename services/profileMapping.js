export const DEFAULT_STATS = {
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

export const INITIAL_USER_PROFILE = {
  name: "",
  age: 25,
  weight: 70,
  gender: "male",
  height: 170,
  activity: "sedentary",
  wakeTime: { hours: 8, minutes: 0 },
  sleepTime: { hours: 23, minutes: 0 },
  goal: 2000,
  onboardingCompleted: false,
  stats: { ...DEFAULT_STATS },
  skins: {
    owned: ["sunGlasses"],
    equipped: []
  },
  notifications: {
    enabled: true,
    frequency: "smart",
    sound: "drop"
  },
  preferences: {
    unitDist: "cm",
    unitWeight: "kg",
    soundEffects: true,
    volume: 50,
    vibration: true,
    theme: "light",
    language: "es"
  }
};

export const mapGameStats = (gameStats) => {
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

export const normalizeLocalProfile = (profile) => {
  if (!profile || typeof profile !== 'object') return profile;

  return {
    ...profile,
    preferences: { ...INITIAL_USER_PROFILE.preferences, ...(profile.preferences || {}) },
    skins: {
      owned: profile.skins?.owned ?? [...INITIAL_USER_PROFILE.skins.owned],
      equipped: profile.skins?.equipped ?? [],
    },
    notifications: {
      ...INITIAL_USER_PROFILE.notifications,
      ...(profile.notifications || {}),
    },
    stats: { ...DEFAULT_STATS, ...(profile.stats || {}) },
  };
};

export const mapBackendToFrontend = (backendUser) => {
  const owned = backendUser.items.map(i => i.itemId);
  const equipped = backendUser.items.filter(i => i.isEquipped).map(i => i.itemId);

  const unlockedAchievements = backendUser.achievements?.map(a => ({
    id: a.achievementId,
    date: a.unlockedAt
  })) || [];

  const hasBiometrics = backendUser.profile?.weight &&
    backendUser.profile?.weight > 0 &&
    backendUser.profile?.height &&
    backendUser.profile?.height > 0 &&
    backendUser.profile?.age &&
    backendUser.profile?.age > 0 &&
    backendUser.profile?.gender &&
    backendUser.profile?.activityLevel &&
    backendUser.settings?.wakeTime &&
    backendUser.settings?.sleepTime &&
    backendUser.profile?.dailyGoal &&
    backendUser.profile?.dailyGoal > 0;

  const rawPrefs = backendUser.settings?.preferences || {};
  const preferences = {
    ...INITIAL_USER_PROFILE.preferences,
    ...rawPrefs,
    soundEffects:
      rawPrefs.soundEffects !== undefined
        ? Boolean(rawPrefs.soundEffects)
        : true,
  };

  return {
    name: backendUser.name,
    email: backendUser.email,
    weight: backendUser.profile?.weight || 0,
    height: backendUser.profile?.height || 0,
    age: backendUser.profile?.age || 0,
    gender: backendUser.profile?.gender || 'other',
    activity: backendUser.profile?.activityLevel || 'sedentary',
    goal: backendUser.profile?.dailyGoal || 2000,
    wakeTime: backendUser.settings?.wakeTime || { hours: 8, minutes: 0 },
    sleepTime: backendUser.settings?.sleepTime || { hours: 23, minutes: 0 },
    stats: mapGameStats(backendUser.gameStats),
    notifications: backendUser.settings?.notifications || { ...INITIAL_USER_PROFILE.notifications },
    preferences,
    skins: { owned, equipped },
    achievements: unlockedAchievements,
    onboardingCompleted: hasBiometrics
  };
};

export const createEmptyProfile = () => ({
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

export const mergeProfilePatch = (prev, newData) => {
  let updatedProfile = { ...prev, ...newData };

  if (newData.stats) {
    updatedProfile = {
      ...updatedProfile,
      stats: { ...prev.stats, ...newData.stats },
    };
  }

  if (newData.skins?.owned) {
    updatedProfile = {
      ...updatedProfile,
      stats: { ...updatedProfile.stats, skinsCount: newData.skins.owned.length }
    };
  }

  return updatedProfile;
};

export const calculateIdealGoal = (profile) => {
  let tmb = 0;

  const weight = parseFloat(profile.weight) || 0;
  const height = parseFloat(profile.height) || 0;
  const age = parseFloat(profile.age) || 0;

  if (profile.gender == "male") {
    tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else if (profile.gender == "female") {
    tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    tmb = (10 * weight) + (6.25 * height) - (5 * age) - 78;
  }

  let factor = 1.2;
  if (profile.activity == "sedentary") {
    factor = 1.2;
  } else if (profile.activity == "moderate") {
    factor = 1.375;
  } else if (profile.activity == "active") {
    factor = 1.55;
  } else if (profile.activity == "highActive") {
    factor = 1.725;
  }

  return Math.round((tmb * factor) / 100) * 100;
};
