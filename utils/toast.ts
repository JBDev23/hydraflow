import { Platform, ToastAndroid } from 'react-native';

type ToastShowFn = (message: string, durationMs: number) => void;

let hostShow: ToastShowFn | null = null;

export type ToastOptions = {
  duration?: 'short' | 'long';
};

/**
 * Register UI host (ToastHost). Returns unregister fn.
 */
export function registerToastHost(showFn: ToastShowFn): () => void {
  hostShow = showFn;
  return () => {
    if (hostShow === showFn) hostShow = null;
  };
}

/**
 * Cross-platform toast. Prefer ToastHost; Android falls back to ToastAndroid.
 */
export function showToast(
  message: string | null | undefined,
  { duration = 'short' }: ToastOptions = {},
): void {
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
