import type { ProfileUpdatePayload } from './api';

export type OfflineLogWaterAction = {
  type: 'LOG_WATER';
  payload: { amount: number };
};

export type OfflineRevertLogAction = {
  type: 'REVERT_LOG';
  payload: Record<string, never> | object;
};

export type OfflineUpdateUserAction = {
  type: 'UPDATE_USER';
  payload: ProfileUpdatePayload | Record<string, unknown>;
};

export type OfflineActionInput =
  | OfflineLogWaterAction
  | OfflineRevertLogAction
  | OfflineUpdateUserAction;

export type QueuedOfflineAction = OfflineActionInput & {
  id: string;
  createdAt: number;
};
