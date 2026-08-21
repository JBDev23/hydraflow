import { notificationService } from './notifications';

let notificationSyncInProgress = false;

export async function syncNotifications(profile, currentWater = 0) {
  if (notificationSyncInProgress) {
    return;
  }

  notificationSyncInProgress = true;

  try {
    await notificationService.scheduleReminders(
      {
        wakeTime: profile.wakeTime,
        sleepTime: profile.sleepTime,
        notifications: profile.notifications
      },
      profile.goal || 2000,
      currentWater
    );
  } catch (error) {
    console.warn("⚠️ Error programando notificaciones:", error);
  } finally {
    notificationSyncInProgress = false;
  }
}
