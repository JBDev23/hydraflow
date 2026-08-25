import type { UserProfile } from '../../types';
import { INITIAL_USER_PROFILE } from '../../services/profileMapping';

const mockScheduleNotificationAsync = jest.fn(async ({ identifier }: { identifier?: string }) => {
  return identifier ?? 'notif-id';
});
const mockCancelAllScheduledNotificationsAsync = jest.fn(async () => undefined);
const mockGetAllScheduledNotificationsAsync = jest.fn(async () => [] as unknown[]);
const mockGetPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));
const mockRequestPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));
const mockSetNotificationChannelAsync = jest.fn(async () => undefined);

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    DATE: 'date',
  },
  AndroidImportance: { HIGH: 5 },
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelAllScheduledNotificationsAsync: (...args: unknown[]) =>
    mockCancelAllScheduledNotificationsAsync(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    mockGetAllScheduledNotificationsAsync(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import {
  generateFixedScheduleTimes,
  generateSmartNextReminderDate,
  notificationService,
} from '../../services/notifications';
import {
  __resetSyncNotificationsForTests,
  syncNotifications,
} from '../../services/syncNotifications';

const baseProfile = (): UserProfile => ({
  ...INITIAL_USER_PROFILE,
  goal: 2000,
  wakeTime: { hours: '8', minutes: '0' },
  sleepTime: { hours: '23', minutes: '0' },
  notifications: {
    enabled: true,
    frequency: 'smart',
    sound: 'drop',
  },
});

describe('generateSmartNextReminderDate', () => {
  test('devuelve solo la próxima fecha (no un abanico del día)', () => {
    const now = new Date(2026, 7, 25, 10, 0, 0);
    const next = generateSmartNextReminderDate({ hour: 23, minute: 0 }, 2000, 500, now);

    expect(next).not.toBeNull();
    expect(next!.getHours()).toBeGreaterThanOrEqual(10);
    expect(next!.getTime()).toBeGreaterThan(now.getTime());
  });

  test('no programa si ya se alcanzó la meta', () => {
    const now = new Date(2026, 7, 25, 10, 0, 0);
    expect(generateSmartNextReminderDate({ hour: 23, minute: 0 }, 2000, 2000, now)).toBeNull();
  });

  test('no programa cerca de la hora de dormir', () => {
    const now = new Date(2026, 7, 25, 22, 40, 0);
    expect(generateSmartNextReminderDate({ hour: 23, minute: 0 }, 2000, 0, now)).toBeNull();
  });

  test('con muchos vasos y poco tiempo el intervalo mínimo es 30 min', () => {
    // 8 vasos, 120 min hasta dormir → floor(120/8)=15 → clamp a 30
    const now = new Date(2026, 7, 25, 21, 0, 0);
    const next = generateSmartNextReminderDate({ hour: 23, minute: 0 }, 2000, 0, now);

    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(21);
    expect(next!.getMinutes()).toBe(30);
  });
});

describe('generateFixedScheduleTimes', () => {
  test('genera slots diarios entre wake y sleep', () => {
    const times = generateFixedScheduleTimes({ hour: 8, minute: 0 }, { hour: 12, minute: 0 }, 60);
    expect(times).toEqual([
      { hour: 9, minute: 0 },
      { hour: 10, minute: 0 },
      { hour: 11, minute: 0 },
    ]);
  });
});

describe('notificationService.scheduleReminders', () => {
  beforeEach(() => {
    mockScheduleNotificationAsync.mockClear();
    mockCancelAllScheduledNotificationsAsync.mockClear();
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

  test('smart mode programa exactamente 1 notificación DATE', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 25, 10, 0, 0));

    const result = await notificationService.scheduleReminders(
      {
        wakeTime: { hours: '8', minutes: '0' },
        sleepTime: { hours: '23', minutes: '0' },
        notifications: { enabled: true, frequency: 'smart', sound: 'drop' },
      },
      2000,
      500,
    );

    expect(result.success).toBe(true);
    expect(result.scheduled).toBe(1);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotificationAsync.mock.calls[0][0].trigger.type).toBe('date');
    expect(mockScheduleNotificationAsync.mock.calls[0][0].identifier).toBe('hydraflow-smart-next');

    jest.useRealTimers();
  });

  test('no programa nuevas si cancelAll deja residuos', async () => {
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: 'stale' }]);

    const result = await notificationService.scheduleReminders(
      {
        wakeTime: { hours: '8', minutes: '0' },
        sleepTime: { hours: '23', minutes: '0' },
        notifications: { enabled: true, frequency: 'smart', sound: 'drop' },
      },
      2000,
      0,
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('pushNotifications.cancelFailed');
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('fixed mode usa triggers DAILY con ids estables', async () => {
    const result = await notificationService.scheduleReminders(
      {
        wakeTime: { hours: '8', minutes: '0' },
        sleepTime: { hours: '11', minutes: '0' },
        notifications: { enabled: true, frequency: '60', sound: 'drop' },
      },
      2000,
      0,
    );

    expect(result.success).toBe(true);
    expect(result.scheduled).toBe(2);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mockScheduleNotificationAsync.mock.calls[0][0].trigger.type).toBe('daily');
    expect(mockScheduleNotificationAsync.mock.calls[0][0].identifier).toBe('hydraflow-daily-9-0');
  });
});

describe('syncNotifications', () => {
  beforeEach(() => {
    __resetSyncNotificationsForTests();
    jest.useFakeTimers();
    jest
      .spyOn(notificationService, 'scheduleReminders')
      .mockResolvedValue({ success: true, scheduled: 1 });
  });

  afterEach(() => {
    __resetSyncNotificationsForTests();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('coalesce: varias llamadas rápidas ejecutan solo el último snapshot', async () => {
    const p1 = baseProfile();
    const p2 = { ...baseProfile(), goal: 2500 };

    const a = syncNotifications(p1, 100);
    const b = syncNotifications(p2, 750);

    jest.advanceTimersByTime(400);
    await Promise.all([a, b]);

    expect(notificationService.scheduleReminders).toHaveBeenCalledTimes(1);
    expect(notificationService.scheduleReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: p2.notifications,
      }),
      2500,
      750,
    );
  });

  test('si llega otro sync mientras corre, encola el más reciente', async () => {
    let resolveFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    (notificationService.scheduleReminders as jest.Mock)
      .mockImplementationOnce(async () => {
        await firstGate;
        return { success: true, scheduled: 1 };
      })
      .mockResolvedValue({ success: true, scheduled: 1 });

    const first = syncNotifications(baseProfile(), 0);
    await jest.advanceTimersByTimeAsync(400);

    const second = syncNotifications(baseProfile(), 900);
    resolveFirst();

    await Promise.all([first, second]);

    expect(notificationService.scheduleReminders).toHaveBeenCalledTimes(2);
    expect(notificationService.scheduleReminders).toHaveBeenLastCalledWith(
      expect.any(Object),
      2000,
      900,
    );
  });
});
