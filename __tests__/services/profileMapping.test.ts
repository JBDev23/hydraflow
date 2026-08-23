import {
  calculateIdealGoal,
  createEmptyProfile,
  DEFAULT_STATS,
  INITIAL_USER_PROFILE,
  mapBackendToFrontend,
  mapGameStats,
  mergeProfilePatch,
  normalizeLocalProfile,
} from '../../services/profileMapping';
import { toProfileUpdatePayload } from '../../services/profilePayload';
import {
  backendUserCompleteBiometrics,
  backendUserIncompleteBiometrics,
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

  test('Debería marcar onboardingCompleted false con biometrics incompletos', () => {
    const profile = mapBackendToFrontend(backendUserIncompleteBiometrics);

    expect(profile.onboardingCompleted).toBe(false);
  });

  test('Debería marcar onboardingCompleted true con biometrics completos', () => {
    const profile = mapBackendToFrontend(backendUserCompleteBiometrics);

    expect(profile.onboardingCompleted).toBe(true);
    expect(profile.name).toBe('Test User');
    expect(profile.weight).toBe(70);
    expect(profile.height).toBe(175);
    expect(profile.goal).toBe(2500);
    expect(profile.activity).toBe('moderate');
    expect(profile.stats.level).toBe(3);
    expect(profile.stats.dropsBalance).toBe(25);
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
    expect(profile.gender).toBe('other');
    expect(profile.activity).toBe('sedentary');
    expect(profile.wakeTime).toEqual({ hours: 8, minutes: 0 });
    expect(profile.sleepTime).toEqual({ hours: 23, minutes: 0 });
    expect(profile.preferences.soundEffects).toBe(true);
    expect(profile.onboardingCompleted).toBe(false);
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
});

describe('calculateIdealGoal', () => {
  const baseProfile = {
    weight: 70,
    height: 175,
    age: 30,
    gender: 'male' as const,
    activity: 'sedentary' as const,
  };

  test('Debería calcular meta para male sedentary', () => {
    const goal = calculateIdealGoal(baseProfile);

    expect(goal).toBe(2000);
    expect(goal % 100).toBe(0);
  });

  test('Debería calcular meta distinta para female', () => {
    const maleGoal = calculateIdealGoal({ ...baseProfile, gender: 'male' });
    const femaleGoal = calculateIdealGoal({ ...baseProfile, gender: 'female' });

    expect(femaleGoal).toBeLessThan(maleGoal);
  });

  test('Debería calcular meta distinta para other', () => {
    const otherGoal = calculateIdealGoal({ ...baseProfile, gender: 'other' });

    expect(otherGoal).toBeGreaterThan(0);
    expect(otherGoal % 100).toBe(0);
  });

  test('Debería aplicar factor de actividad moderate', () => {
    const sedentary = calculateIdealGoal({ ...baseProfile, activity: 'sedentary' });
    const moderate = calculateIdealGoal({ ...baseProfile, activity: 'moderate' });

    expect(moderate).toBeGreaterThan(sedentary);
  });

  test('Debería aplicar factor de actividad active', () => {
    const moderate = calculateIdealGoal({ ...baseProfile, activity: 'moderate' });
    const active = calculateIdealGoal({ ...baseProfile, activity: 'active' });

    expect(active).toBeGreaterThan(moderate);
  });

  test('Debería aplicar factor de actividad highActive', () => {
    const active = calculateIdealGoal({ ...baseProfile, activity: 'active' });
    const highActive = calculateIdealGoal({ ...baseProfile, activity: 'highActive' });

    expect(highActive).toBeGreaterThan(active);
  });

  test('Debería parsear inputs string', () => {
    const goal = calculateIdealGoal({
      weight: '70',
      height: '175',
      age: '30',
      gender: 'male',
      activity: 'sedentary',
    });

    expect(goal).toBe(2000);
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

describe('round-trip BackendUser → mapBackendToFrontend → toProfileUpdatePayload', () => {
  test('No debería perder campos editables del perfil completo', () => {
    const frontend = mapBackendToFrontend(backendUserCompleteBiometrics);
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
