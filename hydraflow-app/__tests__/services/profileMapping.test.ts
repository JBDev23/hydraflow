import {
  calculateIdealGoal,
  createEmptyProfile,
  DEFAULT_STATS,
  INITIAL_USER_PROFILE,
  mapBackendToFrontend,
  mapGameStats,
  mergeProfilePatch,
  normalizeLocalProfile,
  preferencesWithOnboardingFlag,
  resolveOnboardingCompleted,
} from '../../services/profileMapping';
import { toProfileUpdatePayload } from '../../services/profilePayload';
import {
  backendUserComplete,
  backendUserIncomplete,
  backendUserSoundEffectsZero,
  backendUserWithAchievements,
  backendUserWithItems,
  minimalBackendUser,
} from '../fixtures/backendUser';
import { fullUserProfile, skinsPatch } from '../fixtures/userProfile';

describe('mapGameStats', () => {
  test('Debería devolver DEFAULT_STATS para null', () => {
    expect(mapGameStats(null)).toEqual(DEFAULT_STATS);
  });

  test('Debería devolver DEFAULT_STATS para objeto vacío', () => {
    expect(mapGameStats({})).toEqual(DEFAULT_STATS);
  });

  test('Debería usar fallbacks para campos parciales', () => {
    const stats = mapGameStats({ level: 5, dropsBalance: 50 });

    expect(stats.level).toBe(5);
    expect(stats.dropsBalance).toBe(50);
    expect(stats.currentXp).toBe(DEFAULT_STATS.currentXp);
    expect(stats.currentStreak).toBe(DEFAULT_STATS.currentStreak);
  });
});

describe('mapBackendToFrontend', () => {
  test('Debería mapear items a skins owned y equipped', () => {
    const profile = mapBackendToFrontend(backendUserWithItems);

    expect(profile.skins.owned).toEqual(['sunGlasses', 'hat', 'scarf']);
    expect(profile.skins.equipped).toEqual(['sunGlasses', 'scarf']);
  });

  test('Debería mapear achievements a id y date', () => {
    const profile = mapBackendToFrontend(backendUserWithAchievements);

    expect(profile.achievements).toEqual([
      { id: 'FIRST_DRINK', date: '2026-01-15T10:00:00Z' },
      { id: 'STREAK_3', date: '2026-01-20T08:30:00Z' },
    ]);
  });

  test('Debería marcar onboardingCompleted false sin flag o con false', () => {
    const profile = mapBackendToFrontend(backendUserIncomplete);

    expect(profile.onboardingCompleted).toBe(false);
  });

  test('Debería mapear perfil completo con onboardingCompleted true', () => {
    const profile = mapBackendToFrontend(backendUserComplete);

    expect(profile.onboardingCompleted).toBe(true);
    expect(profile.name).toBe('Test User');
    expect(profile.weight).toBe(70);
    expect(profile.height).toBe(175);
    expect(profile.goal).toBe(2500);
    expect(profile.activity).toBe('moderate');
    expect(profile.stats.level).toBe(3);
    expect(profile.stats.dropsBalance).toBe(25);
    expect(profile.preferences).not.toHaveProperty('onboardingCompleted');
  });

  test('Debería marcar onboardingCompleted false si el flag es false', () => {
    const profile = mapBackendToFrontend({
      ...backendUserComplete,
      settings: {
        ...backendUserComplete.settings!,
        preferences: {
          ...backendUserComplete.settings!.preferences,
          onboardingCompleted: false,
        },
      },
    });

    expect(profile.onboardingCompleted).toBe(false);
  });

  test('Debería marcar onboardingCompleted true solo por el flag en preferences', () => {
    const profile = mapBackendToFrontend({
      ...backendUserIncomplete,
      settings: {
        ...backendUserIncomplete.settings!,
        preferences: {
          onboardingCompleted: true,
        },
      },
    });

    expect(profile.onboardingCompleted).toBe(true);
  });

  test('Debería coercionar soundEffects 0 a false', () => {
    const profile = mapBackendToFrontend(backendUserSoundEffectsZero);

    expect(profile.preferences.soundEffects).toBe(false);
  });

  test('Debería usar defaults cuando profile y settings son null', () => {
    const profile = mapBackendToFrontend(minimalBackendUser);

    expect(profile.weight).toBe(0);
    expect(profile.height).toBe(0);
    expect(profile.goal).toBe(2000);
    expect(profile.gender).toBe('male');
    expect(profile.activity).toBe('sedentary');
    expect(profile.wakeTime).toEqual({ hours: 8, minutes: 0 });
    expect(profile.sleepTime).toEqual({ hours: 23, minutes: 0 });
    expect(profile.preferences.soundEffects).toBe(true);
    expect(profile.onboardingCompleted).toBe(false);
  });

  test('Debería reemplazar wakeTime/sleepTime string "[object Object]" por defaults', () => {
    const profile = mapBackendToFrontend({
      ...minimalBackendUser,
      settings: {
        wakeTime: '[object Object]' as unknown as { hours: number; minutes: number },
        sleepTime: '[object Object]' as unknown as { hours: number; minutes: number },
      },
    });

    expect(profile.wakeTime).toEqual({ hours: 8, minutes: 0 });
    expect(profile.sleepTime).toEqual({ hours: 23, minutes: 0 });
  });
});

describe('normalizeLocalProfile', () => {
  test('Debería rellenar preferences, skins, notifications y stats con defaults', () => {
    const cached = {
      name: 'Cached User',
      stats: { level: 2 },
    };

    const normalized = normalizeLocalProfile(cached);

    expect(normalized?.name).toBe('Cached User');
    expect(normalized?.preferences).toEqual(INITIAL_USER_PROFILE.preferences);
    expect(normalized?.skins.owned).toEqual(INITIAL_USER_PROFILE.skins.owned);
    expect(normalized?.notifications).toEqual(INITIAL_USER_PROFILE.notifications);
    expect(normalized?.stats).toEqual({ ...DEFAULT_STATS, level: 2 });
  });

  test('Debería devolver null para null', () => {
    expect(normalizeLocalProfile(null)).toBeNull();
  });
});

describe('mergeProfilePatch', () => {
  test('Debería hacer merge shallow de campos top-level', () => {
    const merged = mergeProfilePatch(fullUserProfile, { name: 'New Name', goal: 1800 });

    expect(merged.name).toBe('New Name');
    expect(merged.goal).toBe(1800);
    expect(merged.age).toBe(fullUserProfile.age);
  });

  test('Debería hacer deep merge de stats', () => {
    const merged = mergeProfilePatch(fullUserProfile, {
      stats: { level: 5, dropsBalance: 100, currentStreak: 10 },
    });

    expect(merged.stats.level).toBe(5);
    expect(merged.stats.dropsBalance).toBe(100);
    expect(merged.stats.currentStreak).toBe(10);
    expect(merged.stats.currentXp).toBe(fullUserProfile.stats.currentXp);
  });

  test('Debería actualizar skinsCount cuando cambia skins.owned', () => {
    const merged = mergeProfilePatch(fullUserProfile, skinsPatch);

    expect(merged.stats.skinsCount).toBe(4);
    expect(merged.skins.owned).toEqual(['sunGlasses', 'hat', 'scarf', 'boots']);
  });

  test('Debería hacer deep merge de preferences sin pisar el resto', () => {
    const merged = mergeProfilePatch(fullUserProfile, {
      preferences: { theme: 'dark', language: 'en' },
    });

    expect(merged.preferences.theme).toBe('dark');
    expect(merged.preferences.language).toBe('en');
    expect(merged.preferences.unitDist).toBe(fullUserProfile.preferences.unitDist);
    expect(merged.preferences.soundEffects).toBe(fullUserProfile.preferences.soundEffects);
    expect(merged.onboardingCompleted).toBe(fullUserProfile.onboardingCompleted);
  });
});

describe('calculateIdealGoal', () => {
  // Yamada WT × 0.68 with defaults: 20°C, 50% RH, 100 m, HDI=0
  const baseProfile = {
    weight: 70,
    age: 30,
    gender: 'male' as const,
    activity: 'sedentary' as const,
  };

  test('Debería calcular meta Yamada para male sedentary', () => {
    const goal = calculateIdealGoal(baseProfile);

    expect(goal).toBe(2300);
    expect(goal % 100).toBe(0);
  });

  test('Debería calcular meta distinta para female', () => {
    const maleGoal = calculateIdealGoal({ ...baseProfile, gender: 'male' });
    const femaleGoal = calculateIdealGoal({ ...baseProfile, gender: 'female' });

    expect(femaleGoal).toBe(2100);
    expect(femaleGoal).toBeLessThan(maleGoal);
  });

  test('Debería calcular meta intermedia para other', () => {
    const maleGoal = calculateIdealGoal({ ...baseProfile, gender: 'male' });
    const femaleGoal = calculateIdealGoal({ ...baseProfile, gender: 'female' });
    const otherGoal = calculateIdealGoal({ ...baseProfile, gender: 'other' });

    expect(otherGoal).toBe(2200);
    expect(otherGoal).toBeGreaterThan(femaleGoal);
    expect(otherGoal).toBeLessThan(maleGoal);
  });

  test('Debería aplicar PAL moderate', () => {
    const sedentary = calculateIdealGoal({ ...baseProfile, activity: 'sedentary' });
    const moderate = calculateIdealGoal({ ...baseProfile, activity: 'moderate' });

    expect(moderate).toBe(2500);
    expect(moderate).toBeGreaterThan(sedentary);
  });

  test('Debería aplicar PAL active', () => {
    const moderate = calculateIdealGoal({ ...baseProfile, activity: 'moderate' });
    const active = calculateIdealGoal({ ...baseProfile, activity: 'active' });

    expect(active).toBe(2700);
    expect(active).toBeGreaterThan(moderate);
  });

  test('Debería marcar atleta en highActive (PAL 2.15 + athlete)', () => {
    const active = calculateIdealGoal({ ...baseProfile, activity: 'active' });
    const highActive = calculateIdealGoal({ ...baseProfile, activity: 'highActive' });

    expect(highActive).toBe(3500);
    expect(highActive).toBeGreaterThan(active);
  });

  test('Debería parsear inputs string', () => {
    const goal = calculateIdealGoal({
      weight: '70',
      age: '30',
      gender: 'male',
      activity: 'sedentary',
    } as Parameters<typeof calculateIdealGoal>[0]);

    expect(goal).toBe(2300);
  });
});

describe('createEmptyProfile', () => {
  test('Debería crear copia independiente de INITIAL_USER_PROFILE', () => {
    const empty = createEmptyProfile();

    empty.name = 'Mutated';
    empty.stats.level = 99;
    empty.skins.owned.push('newSkin');

    expect(INITIAL_USER_PROFILE.name).toBe('');
    expect(INITIAL_USER_PROFILE.stats.level).toBe(1);
    expect(INITIAL_USER_PROFILE.skins.owned).not.toContain('newSkin');
  });
});

describe('resolveOnboardingCompleted / preferencesWithOnboardingFlag', () => {
  test('Debería devolver false cuando onboardingCompleted es false', () => {
    expect(
      resolveOnboardingCompleted({
        ...backendUserComplete,
        settings: {
          ...backendUserComplete.settings!,
          preferences: { onboardingCompleted: false },
        },
      }),
    ).toBe(false);
  });

  test('Debería devolver false si no hay flag en preferences', () => {
    expect(resolveOnboardingCompleted(minimalBackendUser)).toBe(false);
  });

  test('Debería incluir onboardingCompleted en preferences para el API', () => {
    const prefs = preferencesWithOnboardingFlag(INITIAL_USER_PROFILE.preferences, true);

    expect(prefs.onboardingCompleted).toBe(true);
    expect(prefs.language).toBe(INITIAL_USER_PROFILE.preferences.language);
  });
});

describe('round-trip BackendUser → mapBackendToFrontend → toProfileUpdatePayload', () => {
  test('No debería perder campos editables del perfil completo', () => {
    const frontend = mapBackendToFrontend(backendUserComplete);
    const payload = toProfileUpdatePayload(frontend);

    expect(payload.name).toBe('Test User');
    expect(payload.weight).toBe(70);
    expect(payload.height).toBe(175);
    expect(payload.age).toBe(30);
    expect(payload.gender).toBe('male');
    expect(payload.activity).toBe('moderate');
    expect(payload.goal).toBe(2500);
    expect(payload.wakeTime).toEqual({ hours: 7, minutes: 30 });
    expect(payload.sleepTime).toEqual({ hours: 23, minutes: 0 });
    expect(payload.stats).toEqual({
      level: 3,
      dropsBalance: 25,
      currentStreak: 5,
    });
    expect(payload).not.toHaveProperty('skins');
    expect(payload).not.toHaveProperty('achievements');
  });
});
