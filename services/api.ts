import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateForBackend } from '../utils/dateFormatter';
import { offlineManager } from './offline';
import i18n from '../app/i18n';
import { toProfileUpdatePayload } from './profilePayload';
import { showToast } from '../utils/toast';
import { calculateXpGain } from '../utils/xp';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type {
  BackendUser,
  BackendUserItem,
  BuyItemResult,
  CatalogAchievement,
  CatalogItem,
  LoginPayload,
  LoginResponse,
  LogWaterResult,
  ProfileUpdatePayload,
  RevertLogResult,
  StatsChartData,
  StatsMode,
  UpdateUserResult,
  UserProfilePatch,
  WaterLog,
} from '../types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://hydraflow-backend-production.up.railway.app';

type SessionExpiredCallback = () => void;

let sessionExpiredCallback: SessionExpiredCallback | null = null;
let isSyncing = false;

/** Debounce before processing offline queue (exported for tests). */
export const SYNC_DEBOUNCE_MS = 2000;

type ApiHeaders = {
  'Content-Type': string;
  'X-Timezone-Offset': string;
  Authorization?: string;
};

const getHeaders = async (): Promise<ApiHeaders> => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return {
    'Content-Type': 'application/json',
    'X-Timezone-Offset': String(new Date().getTimezoneOffset()),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const isSessionExpiredError = (error: unknown): boolean =>
  error instanceof Error && error.message === 'Sesión expirada';

const rawFetch = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
): Promise<T> => {
  const headers = await getHeaders();
  const options: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined && body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (response.status === 401) {
    if (sessionExpiredCallback) {
      sessionExpiredCallback();
    }
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const text = await response.text();
    try {
      const jsonErr = JSON.parse(text) as { error?: string };
      throw new Error(jsonErr.error || `Error ${response.status}`);
    } catch {
      throw new Error(text || `Error ${response.status}`);
    }
  }
  return response.json() as Promise<T>;
};

const notifyOffline = (): void => {
  showToast('☁️ ' + i18n.t('toast.offlineSave'));
};

const notifyError = (msg: string = '⚠️ ' + i18n.t('toast.conecctionError')): void => {
  showToast(msg);
};

export const api = {
  setupSessionInterceptor: (callback: SessionExpiredCallback): void => {
    sessionExpiredCallback = callback;
  },

  /** POST /auth/login */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as LoginResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('❌ Error API Login:', error);
      throw error;
    }
  },

  /** PUT /user/profile */
  updateUser: async (
    data: UserProfilePatch | ProfileUpdatePayload,
  ): Promise<UpdateUserResult | null> => {
    const payload = toProfileUpdatePayload(data);
    if (Object.keys(payload).length === 0) {
      return { success: true, skipped: true };
    }
    try {
      return await rawFetch<UpdateUserResult>('/user/profile', 'PUT', payload);
    } catch (error) {
      if (isSessionExpiredError(error)) return null;
      console.error('Error Update:', error);
      await offlineManager.addToQueue({ type: 'UPDATE_USER', payload });
      notifyOffline();
      return { success: true, offline: true };
    }
  },

  /** POST /water/log */
  logWater: async (amount: number): Promise<LogWaterResult | null> => {
    try {
      return await rawFetch<LogWaterResult>('/water/log', 'POST', { amount });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      }
      if (isSessionExpiredError(error)) return null;
      await offlineManager.addToQueue({
        type: 'LOG_WATER',
        payload: { amount },
      });
      notifyOffline();
      return {
        success: true,
        offline: true,
        gamification: {
          xpGained: calculateXpGain(amount),
          offlineOptimistic: true,
        },
      };
    }
  },

  /** GET /water/metrics — returns total ml, or null on failure */
  getDailyMetrics: async (date?: Date): Promise<number | null> => {
    try {
      const headers = await getHeaders();
      const url = date
        ? `${API_URL}/water/metrics?date=${formatDateForBackend(date)}`
        : `${API_URL}/water/metrics`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        if (sessionExpiredCallback) {
          sessionExpiredCallback();
        }
        return null;
      }

      const data = (await response.json()) as { total?: number; error?: string };
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
      return data.total || 0;
    } catch (error) {
      console.error('Error getDailyMetrics:', error);
      return null;
    }
  },

  /** DELETE /water/log */
  revertLog: async (): Promise<RevertLogResult | null> => {
    try {
      return await rawFetch<RevertLogResult>('/water/log', 'DELETE');
    } catch (error) {
      if (isSessionExpiredError(error)) return null;

      const cancelled = await offlineManager.cancelLastPendingLogWater();
      if (cancelled?.amount != null) {
        notifyOffline();
        return {
          success: true,
          offline: true,
          cancelledPending: true,
          deletedAmount: cancelled.amount,
        };
      }

      await offlineManager.addToQueue({ type: 'REVERT_LOG', payload: {} });
      notifyOffline();
      return {
        success: true,
        offline: true,
        gamification: null,
      };
    }
  },

  /** GET /user/profile — returns backend user or null */
  getUser: async (): Promise<BackendUser | null> => {
    try {
      const response = await rawFetch<{ user: BackendUser }>('/user/profile', 'GET');
      return response.user;
    } catch (error) {
      if (isSessionExpiredError(error)) return null;
      console.error('Error refresh user:', error);
      return null;
    }
  },

  /** GET /water/range — date → ml map */
  getRangeMetrics: async (
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number> | null> => {
    const formatedStart = formatDateForBackend(startDate);
    const formatedEnd = formatDateForBackend(endDate);

    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${API_URL}/water/range?startDate=${formatedStart}&endDate=${formatedEnd}`,
        {
          method: 'GET',
          headers,
        },
      );

      if (response.status === 401 && sessionExpiredCallback) {
        sessionExpiredCallback();
        return null;
      }

      const data = (await response.json()) as {
        totals?: Record<string, number>;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      return data.totals ?? null;
    } catch (error) {
      console.error('Error get range metrics:', error);
      return null;
    }
  },

  /** GET /water/stats — chart-ready data */
  getStats: async (mode: StatsMode | string, date: Date): Promise<StatsChartData | null> => {
    const formatedRefDate = formatDateForBackend(date);

    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${API_URL}/water/stats?mode=${mode}&refDate=${formatedRefDate}`,
        {
          method: 'GET',
          headers,
        },
      );

      if (response.status === 401 && sessionExpiredCallback) {
        sessionExpiredCallback();
        return null;
      }

      const jsonResponse = (await response.json()) as {
        data?: {
          labels: string[];
          values: number[];
          metric: string;
        };
        error?: string;
      };
      if (!response.ok) throw new Error(jsonResponse.error);

      const graphData = jsonResponse.data;
      if (!graphData) return null;

      let stats: StatsChartData;

      switch (mode) {
        case 'day':
          stats = {
            rows: 7,
            columns: 8,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 100,
          };
          break;
        case 'week':
          stats = {
            rows: 7,
            columns: 7,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 100,
          };
          break;
        case 'month':
          stats = {
            rows: 7,
            columns: graphData.labels.length,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 1,
          };
          break;
        default:
          stats = { rows: 7, columns: 7, values: [], colNames: [] };
          break;
      }
      return stats;
    } catch (error) {
      console.error('Error get day stats:', error);
      notifyError(i18n.t('toast.loadStatsError'));
      return null;
    }
  },

  /** GET /achievements/catalog */
  getAchievements: async (): Promise<CatalogAchievement[]> => {
    try {
      const response = await rawFetch<{ achievements?: CatalogAchievement[] }>(
        '/achievements/catalog',
        'GET',
      );
      return response.achievements || [];
    } catch (error) {
      console.error('Error fetching achievements catalog:', error);
      notifyError(i18n.t('toast.loadAchievementsError'));
      return [];
    }
  },

  /** GET /shop/catalog */
  getItems: async (): Promise<CatalogItem[]> => {
    try {
      const response = await rawFetch<{ items?: CatalogItem[] }>('/shop/catalog', 'GET');
      return response.items || [];
    } catch (error) {
      console.error('Error fetching items catalog:', error);
      notifyError(i18n.t('toast.loadShopError'));
      return [];
    }
  },

  /** POST /shop/buy */
  buyItem: async (itemId: string): Promise<BuyItemResult | null> => {
    try {
      const data = await rawFetch<{
        data?: {
          items?: BackendUserItem[];
          skinsCount?: number;
          dropsBalance?: number;
        };
      }>('/shop/buy', 'POST', { itemId });
      const result = data.data || {};
      return {
        items: result.items,
        skinsCount: result.skinsCount,
        dropsBalance: result.dropsBalance,
      };
    } catch (error) {
      if (isSessionExpiredError(error)) return null;
      console.error('Error buying item:', error);
      notifyError(i18n.t('toast.purchaseError'));
      return null;
    }
  },

  /** POST /shop/equip */
  equipItem: async (itemId: string): Promise<BackendUserItem[] | null> => {
    try {
      const data = await rawFetch<{ items?: BackendUserItem[] }>('/shop/equip', 'POST', {
        itemId,
      });
      return data.items ?? null;
    } catch (error) {
      if (isSessionExpiredError(error)) return null;
      console.error('Error equipping item:', error);
      notifyError(i18n.t('toast.equipError'));
      return null;
    }
  },

  syncOfflineQueue: async (): Promise<boolean> => {
    if (isSyncing) return false;

    isSyncing = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, SYNC_DEBOUNCE_MS));

      const queue = await offlineManager.getQueue();
      if (queue.length === 0) return false;

      let syncCount = 0;

      for (const action of queue) {
        try {
          if (action.type === 'LOG_WATER') {
            await rawFetch('/water/log', 'POST', action.payload);
          } else if (action.type === 'REVERT_LOG') {
            await rawFetch('/water/log', 'DELETE');
          } else if (action.type === 'UPDATE_USER') {
            const payload = toProfileUpdatePayload(
              action.payload as UserProfilePatch | ProfileUpdatePayload,
            );
            if (Object.keys(payload).length > 0) {
              await rawFetch('/user/profile', 'PUT', payload);
            }
          }

          await offlineManager.removeFromQueue(action.id);
          syncCount++;
        } catch (error) {
          if (isSessionExpiredError(error)) {
            console.log('Sincronización detenida: Sesión expirada.');
            break;
          }
          console.error(
            `Error sincronizando acción ${action.type} (Se mantendrá en cola):`,
            error,
          );
        }
      }

      if (syncCount > 0) {
        showToast(`✅ ${syncCount} ${i18n.t('toast.syncData')}`);
        return true;
      }

      return false;
    } finally {
      isSyncing = false;
    }
  },

  /** DELETE /user/account */
  deleteAccount: async (): Promise<boolean> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/user/account`, {
        method: 'DELETE',
        headers,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      sessionExpiredCallback?.();
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      notifyError(i18n.t('toast.deleteAccountError'));
      return false;
    }
  },

  /** GET /water/export */
  exportUserData: async (): Promise<WaterLog[] | null> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/water/export`, {
        method: 'GET',
        headers,
      });
      const data = (await response.json()) as { logs?: WaterLog[]; error?: string };
      if (!response.ok) throw new Error(data.error);
      return data.logs ?? null;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  },
};
