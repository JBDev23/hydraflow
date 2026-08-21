import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const QUEUE_KEY = 'offline_action_queue';

const createId = () => {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};

export const offlineManager = {
  addToQueue: async (action) => {
    try {
      const currentQueue = await offlineManager.getQueue();
      const newQueue = [
        ...currentQueue,
        {
          ...action,
          id: createId(),
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Error guardando offline:', error);
    }
  },

  getQueue: async () => {
    try {
      const json = await AsyncStorage.getItem(QUEUE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      return [];
    }
  },

  clearQueue: async () => {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error('Error limpiando cola:', error);
    }
  },

  removeFromQueue: async (id) => {
    try {
      const queue = await offlineManager.getQueue();
      const newQueue = queue.filter((item) => item.id !== id);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Error eliminando item cola:', error);
    }
  },

  /**
   * If the last pending action is LOG_WATER, remove it (undo before sync).
   * @returns {Promise<{ amount: number } | null>}
   */
  cancelLastPendingLogWater: async () => {
    try {
      const queue = await offlineManager.getQueue();
      for (let i = queue.length - 1; i >= 0; i -= 1) {
        if (queue[i].type === 'LOG_WATER') {
          const removed = queue[i];
          queue.splice(i, 1);
          await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          return removed.payload || null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error cancelando LOG_WATER pendiente:', error);
      return null;
    }
  },
};
