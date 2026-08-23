import { notificationService } from './notifications';
import type { UserProfile } from '../types';

let notificationSyncInProgress = false;

export async function syncNotifications(
  profile: UserProfile,
  currentWater = 0,
): Promise<void> {
  if (notificationSyncInProgress) {
    return;
  }

  notificationSyncInProgress = true;

  try {
    await notificationService.scheduleReminders(
      {
        wakeTime: profile.wakeTime,
        sleepTime: profile.sleepTime,
        notifications: profile.notifications,
      },
      profile.goal || 2000,
      currentWater,
    );
  } catch (error) {
    console.warn('⚠️ Error programando notificaciones:', error);
  } finally {
    notificationSyncInProgress = false;
  }
}
