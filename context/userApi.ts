import type { UserProfile } from '../types';

/** Imperative API exposed via ref from UserProvider to Auth/AppProviders. */
export type UserApi = {
  bootstrapLocalProfile: () => Promise<void>;
  applySessionProfile: (mappedProfile: UserProfile) => Promise<void>;
  syncNotificationsForProfile: (profile: UserProfile, currentWater: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  onLogout: () => Promise<void>;
  getManualName: () => string | undefined;
  getProfile: () => UserProfile;
};
