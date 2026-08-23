/** Canonical frontend profile shapes (post mapBackendToFrontend). */

import type { ThemeModePreference } from './theme';

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'moderate' | 'active' | 'highActive';
export type ProfileFieldKey =
  'name' | 'age' | 'weight' | 'height' | 'gender' | 'activity' | 'wakeTime' | 'sleepTime' | 'goal';
export type ProfileFieldDef = { key: ProfileFieldKey; label: string };
export type SettingsViewId = 'home' | 'notifications' | 'preferences' | 'support' | 'account';
export type WeekRange = { start: Date; end: Date; label: string };

export type TimeOfDay = {
  hours: number;
  minutes: number;
};

export type ProfileFieldValue = string | number | TimeOfDay;

export type GameStats = {
  level: number;
  currentXp: number;
  progress: number;
  achievementsCount: number;
  skinsCount: number;
  dropsBalance: number;
  totalGoalsReached: number;
  currentStreak: number;
  totalVolume: number;
};

export type Preferences = {
  unitDist: string;
  unitWeight: string;
  soundEffects: boolean;
  volume: number;
  vibration: boolean;
  theme: ThemeModePreference;
  language: string;
};

export type Notifications = {
  enabled: boolean;
  frequency: string;
  sound: string;
};

export type Skins = {
  owned: string[];
  equipped: string[];
};

export type UnlockedAchievement = {
  id: string;
  date: string | Date;
};

export type UserProfile = {
  name: string;
  email?: string;
  age: number;
  weight: number;
  gender: string;
  height: number;
  activity: string;
  wakeTime: TimeOfDay;
  sleepTime: TimeOfDay;
  goal: number;
  onboardingCompleted: boolean;
  stats: GameStats;
  skins: Skins;
  notifications: Notifications;
  preferences: Preferences;
  achievements?: UnlockedAchievement[];
};
