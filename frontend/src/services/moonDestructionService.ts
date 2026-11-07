export function calculateMoonDestructionProbability(
  moonDiameterKm: number,
  deathstarCount: number
): number {
  if (deathstarCount <= 0 || moonDiameterKm <= 0) return 0;
  const sqrtD = Math.sqrt(moonDiameterKm);
  const baseTerm = Math.min(1.0, Math.max(0.0, 1.0 - sqrtD / 2500.0));
  const powerTerm = Math.pow(baseTerm, deathstarCount);
  const chance = (1.0 - Math.sqrt(powerTerm)) * 100.0;
  return Math.min(100.0, Math.max(0.0, chance));
}

export function calculateDeathstarSurvivalProbability(
  moonDiameterKm: number,
  deathstarCount: number
): number {
  if (deathstarCount <= 0 || moonDiameterKm <= 0) return 0;
  const sqrtD = Math.sqrt(moonDiameterKm);
  const baseTerm = Math.min(1.0, Math.max(0.0, sqrtD / 2500.0));
  const powerTerm = Math.pow(baseTerm, deathstarCount);
  const survival = (1.0 - Math.sqrt(powerTerm)) * 100.0;
  return Math.min(100.0, Math.max(0.0, survival));
}

export function calculateDeathstarLossProbability(
  moonDiameterKm: number,
  deathstarCount: number = 1
): number {
  const survival = calculateDeathstarSurvivalProbability(
    moonDiameterKm,
    deathstarCount
  );
  return Math.min(100.0, Math.max(0.0, 100.0 - survival));
}

export function calculateMoonDestructionSummary(
  moonDiameterKm: number,
  deathstarCount: number
): {
  destructionProbabilityPercent: number;
  survivalProbabilityPercent: number;
  lossProbabilityPercent: number;
} {
  const destructionProbabilityPercent = calculateMoonDestructionProbability(
    moonDiameterKm,
    deathstarCount
  );
  const survivalProbabilityPercent = calculateDeathstarSurvivalProbability(
    moonDiameterKm,
    deathstarCount
  );
  const lossProbabilityPercent = calculateDeathstarLossProbability(
    moonDiameterKm,
    deathstarCount
  );
  return {
    destructionProbabilityPercent,
    survivalProbabilityPercent,
    lossProbabilityPercent,
  };
}
