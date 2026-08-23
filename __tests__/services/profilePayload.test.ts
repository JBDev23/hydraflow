import { toProfileUpdatePayload } from '../../services/profilePayload';
import {
  partialProfilePatch,
  profileWithIgnoredFields,
  statsPatch,
} from '../fixtures/userProfile';

describe('toProfileUpdatePayload', () => {
  test('Debería devolver {} para null', () => {
    expect(toProfileUpdatePayload(null)).toEqual({});
  });

  test('Debería devolver {} para undefined', () => {
    expect(toProfileUpdatePayload(undefined)).toEqual({});
  });

  test('Debería devolver {} para objeto vacío', () => {
    expect(toProfileUpdatePayload({})).toEqual({});
  });

  test('Debería incluir campos top-level del patch', () => {
    const payload = toProfileUpdatePayload(partialProfilePatch);

    expect(payload).toEqual({
      name: 'Updated Name',
      goal: 3000,
      preferences: { theme: 'dark' },
    });
  });

  test('Debería filtrar stats a level, dropsBalance y currentStreak', () => {
    const payload = toProfileUpdatePayload(statsPatch);

    expect(payload.stats).toEqual({
      level: 5,
      dropsBalance: 100,
      currentStreak: 10,
    });
    expect(payload.stats).not.toHaveProperty('currentXp');
    expect(payload.stats).not.toHaveProperty('totalVolume');
  });

  test('Debería omitir skins, achievements y email del payload', () => {
    const payload = toProfileUpdatePayload(profileWithIgnoredFields);

    expect(payload).toEqual({ name: 'Syncable Name' });
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('skins');
    expect(payload).not.toHaveProperty('achievements');
  });

  test('Debería omitir stats vacíos si no hay campos permitidos', () => {
    const payload = toProfileUpdatePayload({
      stats: { currentXp: 100, totalVolume: 5000, progress: 50 },
    });

    expect(payload).toEqual({});
    expect(payload.stats).toBeUndefined();
  });

  test('Debería incluir notifications y wakeTime cuando están presentes', () => {
    const payload = toProfileUpdatePayload({
      wakeTime: { hours: 6, minutes: 30 },
      sleepTime: { hours: 22, minutes: 0 },
      notifications: { enabled: false, frequency: 'fixed', sound: 'bell' },
    });

    expect(payload.wakeTime).toEqual({ hours: 6, minutes: 30 });
    expect(payload.sleepTime).toEqual({ hours: 22, minutes: 0 });
    expect(payload.notifications).toEqual({
      enabled: false,
      frequency: 'fixed',
      sound: 'bell',
    });
  });
});
