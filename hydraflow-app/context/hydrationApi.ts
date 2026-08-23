/** Imperative API exposed via ref from HydrationProvider. */
export type HydrationApi = {
  refreshDailyWater: () => Promise<number>;
  bumpHydrationEpoch: () => void;
  resetDailyWater: () => void;
  getDailyWater: () => number;
};
