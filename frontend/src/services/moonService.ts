export const MOON_CONSTANTS = {
  initialBaseFields: 1,
  lunarBaseFieldsPerLevel: 3,
  netUsablePerLunarBaseLevel: 2,
  minDiameterStandard: 4500,
  maxDiameterStandard: 8947,
  minDiameterGuaranteed20Percent: 8366,
  maxDiameterSupraRefractor: 9400,
  standardMaxChancePercent: 20,
  supraRefractorMaxChancePercent: 30,
};

export const FORBIDDEN_BUILDINGS_ON_MOON = new Set([
  "metalStorage",
  "crystalStorage",
  "deuteriumTank",
  "metalMine",
  "crystalMine",
  "deuteriumSynthesizer",
  "solarPlant",
  "fusionReactor",
  "terraformer",
]);

export function calculateMoonChance(
  debrisMetal: number,
  debrisCrystal: number,
  maxChance: number = MOON_CONSTANTS.standardMaxChancePercent
): number {
  const debrisTotal = Math.max(0, debrisMetal) + Math.max(0, debrisCrystal);
  const rawChance = Math.floor(debrisTotal / 100_000);
  const cap = Math.min(30, Math.max(20, maxChance));
  return Math.min(cap, Math.max(0, rawChance));
}

export function calculateMoonDiameter(
  debrisTotal: number,
  rngFactor: number = 0.5,
  hasSupraRefractor: boolean = false
): number {
  const maxChance = hasSupraRefractor
    ? MOON_CONSTANTS.supraRefractorMaxChancePercent
    : MOON_CONSTANTS.standardMaxChancePercent;
  const chance = Math.min(
    maxChance,
    Math.max(1, Math.floor(Math.max(0, debrisTotal) / 100_000))
  );
  const clampedRng = Math.min(1.0, Math.max(0.0, rngFactor));
  const maxDiameter = hasSupraRefractor
    ? MOON_CONSTANTS.maxDiameterSupraRefractor
    : MOON_CONSTANTS.maxDiameterStandard;

  if (chance >= 20) {
    // 20% Moon Size Guarantee: strictly >= 8,366 km
    const min = MOON_CONSTANTS.minDiameterGuaranteed20Percent;
    const diameter = min + Math.floor(clampedRng * (maxDiameter - min + 1));
    return Math.min(maxDiameter, Math.max(min, diameter));
  } else {
    // Below 20%: random between 4,500 km and 8,947 km
    const min = MOON_CONSTANTS.minDiameterStandard;
    const diameter = min + Math.floor(clampedRng * (maxDiameter - min + 1));
    return Math.min(maxDiameter, Math.max(min, diameter));
  }
}

export function calculateMoonMaxFields(lunarBaseLevel: number = 0): number {
  return (
    MOON_CONSTANTS.initialBaseFields +
    Math.max(0, lunarBaseLevel) * MOON_CONSTANTS.lunarBaseFieldsPerLevel
  );
}

export function getMoonFieldSummary(lunarBaseLevel: number = 0): {
  totalFields: number;
  lunarBaseFootprint: number;
  netUsableFields: number;
} {
  const totalFields = calculateMoonMaxFields(lunarBaseLevel);
  const lunarBaseFootprint = Math.max(0, lunarBaseLevel);
  const netUsableFields = totalFields - lunarBaseFootprint;
  return {
    totalFields,
    lunarBaseFootprint,
    netUsableFields,
  };
}

export function isBuildingAllowedOnMoon(buildingKey: string): boolean {
  return !FORBIDDEN_BUILDINGS_ON_MOON.has(buildingKey);
}

