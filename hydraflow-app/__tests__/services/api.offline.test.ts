import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { api, SYNC_DEBOUNCE_MS } from '../../services/api';
import { offlineManager } from '../../services/offline';
import { toProfileUpdatePayload } from '../../services/profilePayload';
import { calculateXpGain } from '../../utils/xp';
import {
  mixedOfflineQueue,
  queuedLogWater,
  queuedRevertLog,
  queuedUpdateUser,
} from '../fixtures/offlineQueue';
import { partialProfilePatch } from '../fixtures/userProfile';
import { storage } from '../setup';

const QUEUE_KEY = 'offline_action_queue';

const mockFetchSuccess = (body: unknown = { success: true }) =>
  jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

const mockFetchFailure = () => jest.fn().mockRejectedValue(new Error('Network error'));

const mockFetchUnauthorized = () =>
  jest.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
    text: async () => JSON.stringify({ error: 'Unauthorized' }),
  });

describe('api offline integration', () => {
  beforeEach(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-token');
    global.fetch = mockFetchFailure() as unknown as typeof fetch;
  });

  describe('logWater', () => {
    test('Debería encolar LOG_WATER y devolver respuesta optimista offline', async () => {
      const result = await api.logWater(250);

      expect(result).toEqual({
        success: true,
        offline: true,
        gamification: {
          xpGained: calculateXpGain(250),
          offlineOptimistic: true,
        },
      });

      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('LOG_WATER');
      expect(queue[0].payload).toEqual({ amount: 250 });
    });
  });

  describe('updateUser', () => {
    test('Debería encolar UPDATE_USER con payload filtrado en fallo de red', async () => {
      const result = await api.updateUser(partialProfilePatch);

      expect(result).toEqual({ success: true, offline: true });

      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('UPDATE_USER');
      expect(queue[0].payload).toEqual(toProfileUpdatePayload(partialProfilePatch));
    });

    test('Debería omitir encolado con patch vacío', async () => {
      const result = await api.updateUser({});

      expect(result).toEqual({ success: true, skipped: true });

      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('revertLog', () => {
    test('Debería cancelar último LOG_WATER pendiente sin encolar REVERT_LOG', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedUpdateUser, queuedLogWater]));

      const result = await api.revertLog();

      expect(result).toEqual({
        success: true,
        offline: true,
        cancelledPending: true,
        deletedAmount: 250,
      });

      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('UPDATE_USER');
    });

    test('Debería encolar REVERT_LOG si no hay LOG_WATER pendiente', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedUpdateUser]));

      const result = await api.revertLog();

      expect(result).toEqual({
        success: true,
        offline: true,
        gamification: null,
      });

      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[1].type).toBe('REVERT_LOG');
    });
  });

  describe('syncOfflineQueue', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('Debería devolver false con cola vacía tras debounce', async () => {
      const syncPromise = api.syncOfflineQueue();
      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      const result = await syncPromise;

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('Debería procesar cola FIFO y eliminar acciones exitosas', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedLogWater, queuedUpdateUser]));
      global.fetch = mockFetchSuccess() as unknown as typeof fetch;

      const syncPromise = api.syncOfflineQueue();
      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      const result = await syncPromise;

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const [firstCall, secondCall] = (global.fetch as jest.Mock).mock.calls;
      expect(firstCall[0]).toContain('/water/log');
      expect(firstCall[1]?.method).toBe('POST');
      expect(JSON.parse(firstCall[1]?.body as string)).toEqual({ amount: 250 });

      expect(secondCall[0]).toContain('/user/profile');
      expect(secondCall[1]?.method).toBe('PUT');

      expect(await offlineManager.getQueue()).toEqual([]);
    });

    test('Debería procesar REVERT_LOG con DELETE /water/log', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedRevertLog]));
      global.fetch = mockFetchSuccess() as unknown as typeof fetch;

      const syncPromise = api.syncOfflineQueue();
      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      await syncPromise;

      const [call] = (global.fetch as jest.Mock).mock.calls;
      expect(call[0]).toContain('/water/log');
      expect(call[1]?.method).toBe('DELETE');
    });

    test('Debería detener sync y mantener cola en error de sesión expirada', async () => {
      storage.set(QUEUE_KEY, JSON.stringify(mixedOfflineQueue));
      global.fetch = mockFetchUnauthorized() as unknown as typeof fetch;

      const syncPromise = api.syncOfflineQueue();
      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      const result = await syncPromise;

      expect(result).toBe(false);
      expect(await offlineManager.getQueue()).toHaveLength(3);
    });

    test('Debería mantener acción fallida y posteriores en cola', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedLogWater, queuedRevertLog, queuedUpdateUser]));

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          text: async () => '{}',
        })
        .mockRejectedValueOnce(new Error('Server error')) as unknown as typeof fetch;

      const syncPromise = api.syncOfflineQueue();
      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      const result = await syncPromise;

      expect(result).toBe(true);
      const queue = await offlineManager.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].type).toBe('REVERT_LOG');
      expect(queue[1].type).toBe('UPDATE_USER');
    });

    test('Debería rechazar sync concurrente mientras isSyncing es true', async () => {
      storage.set(QUEUE_KEY, JSON.stringify([queuedLogWater]));
      global.fetch = mockFetchSuccess() as unknown as typeof fetch;

      const firstSync = api.syncOfflineQueue();
      const secondResult = await api.syncOfflineQueue();

      expect(secondResult).toBe(false);

      await jest.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
      await firstSync;
    });
  });
});
