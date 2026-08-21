/** Must stay in sync with backend `XP_PER_ML` in gamification.ts */
const XP_PER_ML = 0.1;

export function calculateXpGain(amountMl) {
  const amount = Number(amountMl);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount * XP_PER_ML);
}
