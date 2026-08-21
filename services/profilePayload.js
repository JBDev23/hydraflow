/**
 * Maps a canonical in-app profile patch to the PUT /user/profile body.
 * Omits fields the backend ignores (skins, achievements, email, etc.).
 * Stats use canonical names: dropsBalance, currentStreak, level.
 */
export function toProfileUpdatePayload(partial) {
  if (!partial || typeof partial !== 'object') return {};

  const payload = {};

  const topLevelKeys = [
    'name',
    'weight',
    'height',
    'age',
    'gender',
    'activity',
    'goal',
    'wakeTime',
    'sleepTime',
    'preferences',
    'notifications',
  ];

  for (const key of topLevelKeys) {
    if (partial[key] !== undefined) {
      payload[key] = partial[key];
    }
  }

  if (partial.stats && typeof partial.stats === 'object') {
    const stats = {};
    if (partial.stats.level !== undefined) {
      stats.level = partial.stats.level;
    }
    if (partial.stats.dropsBalance !== undefined) {
      stats.dropsBalance = partial.stats.dropsBalance;
    }
    if (partial.stats.currentStreak !== undefined) {
      stats.currentStreak = partial.stats.currentStreak;
    }

    if (Object.keys(stats).length > 0) {
      payload.stats = stats;
    }
  }

  return payload;
}
