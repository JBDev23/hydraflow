import { notificationService } from './notifications';
import type { UserProfile } from '../types';

const DEBOUNCE_MS = 400;

type PendingSync = {
  profile: UserProfile;
  currentWater: number;
};

let pending: PendingSync | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let waiters: Array<() => void> = [];

const notifyWaiters = () => {
  const current = waiters;
  waiters = [];
  current.forEach((resolve) => resolve());
};

const executeSchedule = async ({ profile, currentWater }: PendingSync): Promise<void> => {
  await notificationService.scheduleReminders(
    {
      wakeTime: profile.wakeTime,
      sleepTime: profile.sleepTime,
      notifications: profile.notifications,
    },
    profile.goal || 2000,
    currentWater,
  );
};

const runLoop = async (): Promise<void> => {
  running = true;
  try {
    while (pending) {
      const next = pending;
      pending = null;
      try {
        await executeSchedule(next);
      } catch (error) {
        console.warn('⚠️ Error programando notificaciones:', error);
      }
    }
  } finally {
    running = false;
    notifyWaiters();
    if (pending) {
      scheduleDebouncedFlush();
    }
  }
};

const scheduleDebouncedFlush = (): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (!running) {
      void runLoop();
    }
  }, DEBOUNCE_MS);
};

/**
 * Coalesces concurrent syncs into the latest profile/water snapshot.
 * Rapid calls (e.g. drink + refresh) debounce, then run latest only.
 */
export function syncNotifications(profile: UserProfile, currentWater = 0): Promise<void> {
  pending = { profile, currentWater };

  return new Promise((resolve) => {
    waiters.push(resolve);

    if (!running) {
      scheduleDebouncedFlush();
    }
  });
}

/** Test-only: reset module state between cases. */
export function __resetSyncNotificationsForTests(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = null;
  pending = null;
  running = false;
  waiters = [];
}
