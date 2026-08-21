import { Platform, ToastAndroid } from 'react-native';

let hostShow = null;

/**
 * Register UI host (ToastHost). Returns unregister fn.
 */
export function registerToastHost(showFn) {
  hostShow = showFn;
  return () => {
    if (hostShow === showFn) hostShow = null;
  };
}

/**
 * Cross-platform toast. Prefer ToastHost; Android falls back to ToastAndroid.
 * @param {string} message
 * @param {{ duration?: 'short' | 'long' }} [options]
 */
export function showToast(message, { duration = 'short' } = {}) {
  const text = String(message ?? '').trim();
  if (!text) return;

  const ms = duration === 'long' ? 3500 : 2200;

  if (hostShow) {
    hostShow(text, ms);
    return;
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(
      text,
      duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT,
    );
  }
}
