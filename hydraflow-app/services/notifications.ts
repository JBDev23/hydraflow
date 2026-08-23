import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Notifications as NotificationSettings, TimeOfDay } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FREQUENCY_MAP: Record<string, number> = {
  '30': 30,
  '60': 60,
  '120': 120,
};

const ANDROID_CHANNEL_ID = 'hydration-reminders';

type HourMinute = { hour: number; minute: number };

type ScheduleSettings = {
  wakeTime?: TimeOfDay;
  sleepTime?: TimeOfDay;
  notifications?: NotificationSettings;
};

export type NotificationScheduleResult = {
  success: boolean;
  scheduled?: number;
  message?: string;
  error?: unknown;
};

export type NotificationCancelResult = {
  success: boolean;
  error?: unknown;
};

const validateTimeConfig = (
  timeConfig: TimeOfDay | undefined,
  defaultHour: number,
  defaultMinute: number,
): HourMinute => {
  const hour = Math.max(0, Math.min(23, parseInt(String(timeConfig?.hours ?? defaultHour), 10)));
  const minute = Math.max(
    0,
    Math.min(59, parseInt(String(timeConfig?.minutes ?? defaultMinute), 10)),
  );
  return { hour, minute };
};

const setupAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de Hidratación',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#79D8FE',
      enableVibrate: true,
      enableLights: true,
    });
  } catch (error) {
    console.warn('⚠️ Error configurando canal Android:', error);
  }
};

const generateFixedScheduleTimes = (
  wakeTime: HourMinute,
  sleepTime: HourMinute,
  intervalMinutes: number,
): HourMinute[] => {
  const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
  const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;

  const times: HourMinute[] = [];
  let currentMinutes = wakeMinutes + intervalMinutes;

  while (currentMinutes < sleepMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    times.push({ hour, minute });
    currentMinutes += intervalMinutes;
  }
  return times;
};

const generateSmartScheduleTimes = (
  sleepTime: HourMinute,
  dailyGoal: number,
  currentDrinked: number,
): HourMinute[] => {
  const remainingWater = dailyGoal - currentDrinked;

  if (remainingWater <= 0) return [];

  const cupsNeeded = Math.ceil(remainingWater / 250);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;

  if (currentMinutes >= sleepMinutes - 30) return [];

  const availableMinutes = sleepMinutes - currentMinutes;
  const calculatedInterval = Math.max(30, Math.floor(availableMinutes / cupsNeeded));

  const times: HourMinute[] = [];
  let nextNotificationMinute = currentMinutes + calculatedInterval;

  for (let i = 0; i < cupsNeeded; i++) {
    if (nextNotificationMinute >= sleepMinutes) break;

    const hour = Math.floor(nextNotificationMinute / 60);
    const minute = nextNotificationMinute % 60;
    const normalizedHour = hour >= 24 ? hour - 24 : hour;

    times.push({ hour: normalizedHour, minute });
    nextNotificationMinute += calculatedInterval;
  }
  return times;
};

const scheduleNotificationAtTime = async (
  hour: number,
  minute: number,
  channelId: string,
  repeats: boolean,
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Hora de hidratarse! 💧',
        body: 'Tu cuerpo necesita agua para alcanzar la meta de hoy.',
        sound: true,
        vibrate: [0, 250, 250, 250],
        data: { type: 'hydration-reminder' },
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats,
      } as Notifications.NotificationTriggerInput,
    });

    return notificationId;
  } catch (error) {
    console.error(
      `❌ Error programando notificación a las ${hour}:${minute.toString().padStart(2, '0')}:`,
      error,
    );
    return null;
  }
};

export const notificationService = {
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificaciones denegados.');
        return false;
      }

      await setupAndroidChannel();
      return true;
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  },

  scheduleReminders: async (
    settings: ScheduleSettings,
    dailyGoal = 2000,
    currentDrinked = 0,
  ): Promise<NotificationScheduleResult> => {
    try {
      if (!settings?.notifications?.enabled) {
        await notificationService.cancelAll();
        return { success: true, scheduled: 0, message: 'Notificaciones desactivadas' };
      }

      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) throw new Error('Permisos no otorgados');

      await Notifications.getAllScheduledNotificationsAsync();
      await notificationService.cancelAll();

      const wakeTime = validateTimeConfig(settings.wakeTime, 8, 0);
      const sleepTime = validateTimeConfig(settings.sleepTime, 23, 0);

      const freqKey = settings.notifications.frequency || 'smart';
      const isSmartMode = freqKey === 'smart';

      const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
      const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;
      if (wakeMinutes >= sleepMinutes) {
        throw new Error('Hora de despertar debe ser anterior a dormir');
      }

      let scheduleTimes: HourMinute[] = [];
      let shouldRepeat = true;

      if (isSmartMode) {
        scheduleTimes = generateSmartScheduleTimes(sleepTime, dailyGoal, currentDrinked);
        shouldRepeat = false;
      } else {
        const intervalMinutes = FREQUENCY_MAP[freqKey] || 90;
        scheduleTimes = generateFixedScheduleTimes(wakeTime, sleepTime, intervalMinutes);
        shouldRepeat = true;
      }

      if (scheduleTimes.length === 0) {
        return { success: true, scheduled: 0, message: 'No hay recordatorios necesarios para hoy' };
      }

      const results = await Promise.all(
        scheduleTimes.map(({ hour, minute }) =>
          scheduleNotificationAtTime(hour, minute, ANDROID_CHANNEL_ID, shouldRepeat),
        ),
      );

      const scheduledCount = results.filter((id) => id !== null).length;

      await Notifications.getAllScheduledNotificationsAsync();

      return {
        success: true,
        scheduled: scheduledCount,
        message: `${scheduledCount} recordatorios programados (${isSmartMode ? 'Hoy' : 'Diarios'})`,
      };
    } catch (error) {
      console.error('❌ Error en scheduleReminders:', error);
      return {
        success: false,
        scheduled: 0,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },

  cancelAll: async (): Promise<NotificationCancelResult> => {
    try {
      await Notifications.getAllScheduledNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando notificaciones:', error);
      return { success: false, error };
    }
  },

  getAllScheduled: async (): Promise<Notifications.NotificationRequest[]> => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(
      `📋 Notificaciones programadas: ${scheduled.length}`,
      scheduled.map((n) => {
        const trigger = n.trigger as { hour?: number; minute?: number };
        return `${trigger.hour}:${String(trigger.minute).padStart(2, '0')}`;
      }),
    );
    return scheduled;
  },
};
