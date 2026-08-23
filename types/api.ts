import type {
  GameStats,
  Notifications,
  Preferences,
  Skins,
  TimeOfDay,
  UserProfile,
} from './profile';

/** Backend user shape from GET /user/profile and login (with includes). */

export type BackendProfile = {
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  dailyGoal?: number | null;
};

export type BackendSettings = {
  wakeTime?: TimeOfDay | null;
  sleepTime?: TimeOfDay | null;
  preferences?: Partial<Preferences> | Record<string, unknown> | null;
  notifications?: Notifications | Record<string, unknown> | null;
};

export type BackendGameStats = Partial<GameStats> | null | undefined;

export type BackendUserItem = {
  itemId: string;
  isEquipped: boolean;
};

export type BackendUserAchievement = {
  achievementId: string;
  unlockedAt: string | Date;
};

export type BackendUser = {
  id?: string;
  name?: string | null;
  email?: string;
  profile?: BackendProfile | null;
  settings?: BackendSettings | null;
  gameStats?: BackendGameStats;
  items: BackendUserItem[];
  achievements?: BackendUserAchievement[];
};

/** POST /auth/login */
export type LoginPayload = {
  token?: string;
  provider?: 'google' | 'test' | string;
  manualEmail?: string;
  manualName?: string;
  deviceLanguage?: string;
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: BackendUser;
};

/** PUT /user/profile body (flat, not nested Prisma). */
export type ProfileUpdatePayload = {
  name?: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activity?: string;
  goal?: number;
  wakeTime?: TimeOfDay;
  sleepTime?: TimeOfDay;
  preferences?: Preferences | Partial<Preferences>;
  notifications?: Notifications | Partial<Notifications>;
  stats?: {
    level?: number;
    dropsBalance?: number;
    currentStreak?: number;
  };
};

export type GamificationResult = {
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  dropsBalance?: number;
  dropsEarned?: number;
  currentXp?: number;
  xpToNextLevel?: number;
  progress?: number;
  currentStreak?: number;
  totalGoalsReached?: number;
  totalVolume?: number;
  newAchievements?: unknown[];
  achievementsCount?: number;
  isNewStreak?: boolean;
  isGoalReached?: boolean;
  offlineOptimistic?: boolean;
};

export type WaterLog = {
  id: number;
  userId: string;
  amount: number;
  timestamp: string | Date;
};

/** POST /water/log — online */
export type LogWaterOnlineResponse = {
  success: true;
  logged: WaterLog;
  gamification: GamificationResult;
  offline?: false;
};

/** POST /water/log — queued offline */
export type LogWaterOfflineResponse = {
  success: true;
  offline: true;
  gamification: {
    xpGained: number;
    offlineOptimistic: true;
  };
};

export type LogWaterResult = LogWaterOnlineResponse | LogWaterOfflineResponse;

/** DELETE /water/log — online */
export type RevertLogOnlineResponse = {
  success: true;
  deletedAmount?: number;
  gamification?: GamificationResult | null;
  message?: string;
  offline?: false;
};

export type RevertLogOfflineResponse =
  | {
      success: true;
      offline: true;
      cancelledPending: true;
      deletedAmount: number;
    }
  | {
      success: true;
      offline: true;
      gamification: null;
    };

export type RevertLogResult = RevertLogOnlineResponse | RevertLogOfflineResponse;

export type UpdateUserOnlineResponse = {
  success: true;
  user?: unknown;
  offline?: false;
  skipped?: never;
};

export type UpdateUserSkippedResponse = {
  success: true;
  skipped: true;
};

export type UpdateUserOfflineResponse = {
  success: true;
  offline: true;
};

export type UpdateUserResult =
  UpdateUserOnlineResponse | UpdateUserSkippedResponse | UpdateUserOfflineResponse;

export type StatsMode = 'day' | 'week' | 'month';

/** Chart-ready shape returned by api.getStats */
export type StatsChartData = {
  rows: number;
  columns: number;
  values: number[];
  colNames: string[];
  metric?: string;
  ceil?: number;
};

export type CatalogItem = {
  id: string;
  category: string;
  price: number;
  isActive?: boolean;
  name: Record<string, string> | string;
  description?: Record<string, string> | string | null;
};

export type CatalogAchievement = {
  id: string;
  icon: string;
  condition?: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string;
};

export type BuyItemResult = {
  items?: BackendUserItem[];
  skinsCount?: number;
  dropsBalance?: number;
};

/** Partial profile patch accepted by updateUser / updateUserProfile */
export type UserProfilePatch = Partial<
  Omit<UserProfile, 'stats' | 'skins' | 'preferences' | 'notifications'>
> & {
  stats?: Partial<GameStats>;
  skins?: Partial<Skins> & { owned?: string[]; equipped?: string[] };
  preferences?: Partial<Preferences>;
  notifications?: Partial<Notifications>;
};
