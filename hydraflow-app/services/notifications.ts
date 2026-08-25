import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../app/i18n';
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
const SMART_NOTIFICATION_ID = 'hydraflow-smart-next';

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
      name: i18n.t('pushNotifications.channelName'),
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

/** Fixed frequency: all HH:MM slots from wake→sleep (daily repeating). */
export const generateFixedScheduleTimes = (
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

/**
 * Smart mode: only the next one-shot reminder.
 * Spacing = remaining cups of 250ml distributed until sleep (min 30 min).
 */
export const generateSmartNextReminderDate = (
  sleepTime: HourMinute,
  dailyGoal: number,
  currentDrinked: number,
  now: Date = new Date(),
): Date | null => {
  const remainingWater = dailyGoal - currentDrinked;
  if (remainingWater <= 0) return null;

  const cupsNeeded = Math.ceil(remainingWater / 250);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;

  if (currentMinutes >= sleepMinutes - 30) return null;

  const availableMinutes = sleepMinutes - currentMinutes;
  const calculatedInterval = Math.max(30, Math.floor(availableMinutes / cupsNeeded));
  const nextNotificationMinute = currentMinutes + calculatedInterval;

  if (nextNotificationMinute >= sleepMinutes) return null;

  const hour = Math.floor(nextNotificationMinute / 60) % 24;
  const minute = nextNotificationMinute % 60;

  const date = new Date(now);
  date.setSeconds(0, 0);
  date.setHours(hour, minute, 0, 0);

  if (date.getTime() <= now.getTime()) return null;

  return date;
};

const notificationContent = (channelId: string) => ({
  title: i18n.t('pushNotifications.title'),
  body: i18n.t('pushNotifications.body'),
  sound: true as const,
  vibrate: [0, 250, 250, 250],
  data: { type: 'hydration-reminder' },
  ...(Platform.OS === 'android' && { channelId }),
});

const scheduleDailyAtTime = async (
  hour: number,
  minute: number,
  channelId: string,
): Promise<string | null> => {
  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: `hydraflow-daily-${hour}-${minute}`,
      content: notificationContent(channelId),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === 'android' && { channelId }),
      },
    });
  } catch (error) {
    console.error(
      `❌ Error programando notificación diaria a las ${hour}:${minute.toString().padStart(2, '0')}:`,
      error,
    );
    return null;
  }
};

const scheduleOneShotAtDate = async (date: Date, channelId: string): Promise<string | null> => {
  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: SMART_NOTIFICATION_ID,
      content: notificationContent(channelId),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(Platform.OS === 'android' && { channelId }),
      },
    });
  } catch (error) {
    console.error(`❌ Error programando notificación one-shot:`, error);
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
        const cancelWhenDisabled = await notificationService.cancelAll();
        if (!cancelWhenDisabled.success) {
          return {
            success: false,
            scheduled: 0,
            message: i18n.t('pushNotifications.cancelFailed'),
            error: cancelWhenDisabled.error,
          };
        }
        return { success: true, scheduled: 0, message: i18n.t('pushNotifications.disabled') };
      }

      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) throw new Error(i18n.t('pushNotifications.permissionsDenied'));

      const cancelResult = await notificationService.cancelAll();
      if (!cancelResult.success) {
        return {
          success: false,
          scheduled: 0,
          message: i18n.t('pushNotifications.cancelFailed'),
          error: cancelResult.error,
        };
      }

      const wakeTime = validateTimeConfig(settings.wakeTime, 8, 0);
      const sleepTime = validateTimeConfig(settings.sleepTime, 23, 0);

      const freqKey = settings.notifications.frequency || 'smart';
      const isSmartMode = freqKey === 'smart';

      const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
      const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;
      if (wakeMinutes >= sleepMinutes) {
        throw new Error(i18n.t('pushNotifications.wakeBeforeSleep'));
      }

      let scheduledCount = 0;

      if (isSmartMode) {
        const nextDate = generateSmartNextReminderDate(sleepTime, dailyGoal, currentDrinked);
        if (!nextDate) {
          return {
            success: true,
            scheduled: 0,
            message: i18n.t('pushNotifications.noRemindersToday'),
          };
        }

        const id = await scheduleOneShotAtDate(nextDate, ANDROID_CHANNEL_ID);
        scheduledCount = id ? 1 : 0;
      } else {
        const intervalMinutes = FREQUENCY_MAP[freqKey] || 90;
        const scheduleTimes = generateFixedScheduleTimes(wakeTime, sleepTime, intervalMinutes);

        if (scheduleTimes.length === 0) {
          return {
            success: true,
            scheduled: 0,
            message: i18n.t('pushNotifications.noRemindersToday'),
          };
        }

        const results = await Promise.all(
          scheduleTimes.map(({ hour, minute }) =>
            scheduleDailyAtTime(hour, minute, ANDROID_CHANNEL_ID),
          ),
        );
        scheduledCount = results.filter((id) => id !== null).length;
      }

      return {
        success: true,
        scheduled: scheduledCount,
        message: isSmartMode
          ? i18n.t('pushNotifications.scheduledSmart')
          : i18n.t('pushNotifications.scheduledDaily', { count: scheduledCount }),
      };
    } catch (error) {
      console.error('❌ Error en scheduleReminders:', error);
      return {
        success: false,
        scheduled: 0,
        message: error instanceof Error ? error.message : String(error),
        error,
      };
    }
  },

  cancelAll: async (): Promise<NotificationCancelResult> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      let remaining = await Notifications.getAllScheduledNotificationsAsync();
      if (remaining.length > 0) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        remaining = await Notifications.getAllScheduledNotificationsAsync();
      }

      if (remaining.length > 0) {
        const error = new Error(
          `Still have ${remaining.length} scheduled notifications after cancel`,
        );
        console.error('❌ Error cancelando notificaciones:', error);
        return { success: false, error };
      }

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
        const trigger = n.trigger as { hour?: number; minute?: number; type?: string };
        if (trigger.hour != null && trigger.minute != null) {
          return `${trigger.hour}:${String(trigger.minute).padStart(2, '0')}`;
        }
        return `${n.identifier}(${trigger.type ?? 'unknown'})`;
      }),
    );
    return scheduled;
  },
};
