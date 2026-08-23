import type { QueuedOfflineAction } from '../../types';

export const queuedLogWater: QueuedOfflineAction = {
  id: 'action-1',
  type: 'LOG_WATER',
  payload: { amount: 250 },
  createdAt: 1000,
};

export const queuedLogWaterSecond: QueuedOfflineAction = {
  id: 'action-2',
  type: 'LOG_WATER',
  payload: { amount: 500 },
  createdAt: 2000,
};

export const queuedRevertLog: QueuedOfflineAction = {
  id: 'action-3',
  type: 'REVERT_LOG',
  payload: {},
  createdAt: 3000,
};

export const queuedUpdateUser: QueuedOfflineAction = {
  id: 'action-4',
  type: 'UPDATE_USER',
  payload: { name: 'Offline Update', goal: 2400 },
  createdAt: 4000,
};

export const mixedOfflineQueue: QueuedOfflineAction[] = [
  queuedUpdateUser,
  queuedLogWater,
  queuedLogWaterSecond,
];
