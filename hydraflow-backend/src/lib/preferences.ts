export const DEFAULT_PREFERENCES = {
  unitDist: 'cm',
  unitWeight: 'kg',
  soundEffects: true,
  volume: 50,
  vibration: true,
  theme: 'light',
  language: 'es',
};

/**
 * Merge prefs with defaults and optional language fallback.
 */
export function normalizePreferences(
  prefs: Record<string, unknown> | null | undefined,
  languageFallback?: string,
): typeof DEFAULT_PREFERENCES & Record<string, unknown> {
  const base = { ...DEFAULT_PREFERENCES, ...(prefs || {}) } as Record<string, unknown>;

  if (languageFallback && !base.language) {
    base.language = languageFallback;
  }

  return {
    ...base,
    soundEffects: base.soundEffects !== undefined ? Boolean(base.soundEffects) : true,
  } as typeof DEFAULT_PREFERENCES & Record<string, unknown>;
}
