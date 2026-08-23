import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineManager } from '../../services/offline';
import { mixedOfflineQueue, queuedLogWater, queuedUpdateUser } from '../fixtures/offlineQueue';
import { storage } from '../setup';

const QUEUE_KEY = 'offline_action_queue';

describe('offlineManager', () => {
  test('addToQueue debería persistir acción con id y createdAt', async () => {
    await offlineManager.addToQueue({
      type: 'LOG_WATER',
      payload: { amount: 250 },
    });

    const raw = storage.get(QUEUE_KEY);
    expect(raw).toBeDefined();

    const queue = JSON.parse(raw!);
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('LOG_WATER');
    expect(queue[0].payload).toEqual({ amount: 250 });
    expect(queue[0].id).toBe('test-uuid-1');
    expect(typeof queue[0].createdAt).toBe('number');
  });

  test('getQueue debería devolver [] cuando la cola está vacía', async () => {
    expect(await offlineManager.getQueue()).toEqual([]);
  });

  test('getQueue debería devolver [] con JSON corrupto', async () => {
    storage.set(QUEUE_KEY, 'not-valid-json');

    expect(await offlineManager.getQueue()).toEqual([]);
  });

  test('removeFromQueue debería eliminar solo la acción indicada', async () => {
    storage.set(QUEUE_KEY, JSON.stringify(mixedOfflineQueue));

    await offlineManager.removeFromQueue('action-2');

    const queue = await offlineManager.getQueue();
    expect(queue).toHaveLength(2);
    expect(queue.map((item) => item.id)).toEqual(['action-4', 'action-1']);
  });

  test('clearQueue debería borrar la clave de almacenamiento', async () => {
    storage.set(QUEUE_KEY, JSON.stringify([queuedLogWater]));

    await offlineManager.clearQueue();

    expect(storage.has(QUEUE_KEY)).toBe(false);
    expect(await offlineManager.getQueue()).toEqual([]);
  });

  test('cancelLastPendingLogWater debería eliminar el último LOG_WATER', async () => {
    storage.set(QUEUE_KEY, JSON.stringify(mixedOfflineQueue));

    const cancelled = await offlineManager.cancelLastPendingLogWater();

    expect(cancelled).toEqual({ amount: 500 });
    const queue = await offlineManager.getQueue();
    expect(queue).toHaveLength(2);
    expect(queue.every((item) => item.type !== 'LOG_WATER' || item.id !== 'action-2')).toBe(true);
    expect(queue.some((item) => item.type === 'LOG_WATER' && item.id === 'action-1')).toBe(true);
  });

  test('cancelLastPendingLogWater debería devolver null sin LOG_WATER pendiente', async () => {
    storage.set(QUEUE_KEY, JSON.stringify([queuedUpdateUser]));

    const cancelled = await offlineManager.cancelLastPendingLogWater();

    expect(cancelled).toBeNull();
    expect(await offlineManager.getQueue()).toHaveLength(1);
  });

  test('addToQueue debería apilar acciones en orden FIFO', async () => {
    await offlineManager.addToQueue({ type: 'UPDATE_USER', payload: { name: 'A' } });
    await offlineManager.addToQueue({ type: 'LOG_WATER', payload: { amount: 100 } });

    const queue = await offlineManager.getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE_USER');
    expect(queue[1].type).toBe('LOG_WATER');
  });

  test('removeFromQueue debería usar AsyncStorage.setItem', async () => {
    storage.set(QUEUE_KEY, JSON.stringify([queuedLogWater, queuedUpdateUser]));

    await offlineManager.removeFromQueue('action-1');

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
