export const BASE_KM_COST = 750;
export const MIN_HALVE_KM_COST = 50;

/**
 * Calculates the Dark Matter cost to halve the construction/research duration.
 * Scales proportionally with remaining time ratio, with a minimum floor of 50 KM.
 * Formula: max(50, floor(750 * (1 + targetLevel / 10) * (remainingSeconds / totalDurationSeconds)))
 */
export function calculateHalveDurationCost(
  targetLevel: number,
  remainingSeconds: number,
  totalDurationSeconds: number
): number {
  if (remainingSeconds <= 0) return MIN_HALVE_KM_COST;
  const safeTotal = totalDurationSeconds <= 0 ? remainingSeconds : totalDurationSeconds;
  const ratio = Math.min(1.0, Math.max(0.0, remainingSeconds / safeTotal));
  const levelMult = 1.0 + Math.max(0, targetLevel) / 10.0;
  const cost = Math.floor(BASE_KM_COST * levelMult * ratio);
  return Math.max(MIN_HALVE_KM_COST, cost);
}

/**
 * Calculates the Dark Matter cost for instant completion.
 * Formula: max(750, floor(1500 * (1 + targetLevel / 10) * sqrt(remainingSeconds / 3600)))
 */
export function calculateInstantCompletionCost(
  targetLevel: number,
  remainingSeconds: number
): number {
  if (remainingSeconds <= 0) return BASE_KM_COST;
  const timeFactor = Math.sqrt(remainingSeconds / 3600.0);
  const levelMult = 1.0 + Math.max(0, targetLevel) / 10.0;
  const cost = Math.floor(1500.0 * levelMult * timeFactor);
  return Math.max(BASE_KM_COST, cost);
}

