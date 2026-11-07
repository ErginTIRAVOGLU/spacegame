/**
 * lifeformMathService.ts
 *
 * Sidian OGame Wiki Lifeforms Mathematical Formulas, Building Caps & Superlinear Mechanics:
 * - Building Cost with target level multiplication: Cost(L) = floor(baseCost * factor^(L-1) * L * (1 - CostReductionBonus))
 * - Building Energy: Energy(L) = floor(L * energyBase * factor^L)
 * - Building Duration (seconds): T_building(L) = floor(L * durationBase * durationFactor^L / ((1 + Robotics) * 2^Nanite * EcoSpeed))
 * - Superlinear Building Bonus: Bonus(L) = L^increaseFactor * (baseValue / 100)
 * - Tech Cost & Duration with Research Centre discounts
 * - Total Tech Bonus: BaseTechBonus(L) * (1 + SpeciesLevelBonus + PlanetMetropolisBonus)
 * - Species XP level bonus: Max Level 100 (+0.1% per level, up to +10%)
 * - Building Hard Caps (Rune Technologium, Rock'tal production, Psionic Modulator, Ship Manufacturing Hall, Supra Refractor)
 * - Kaelesh Bio Modifier field loss & construction rules
 * - Tier pause rule (T2 paused if T1 < 6 slots, T3 paused if T1 or T2 < 6 slots)
 */

export const MAX_SPECIES_LEVEL = 100;
export const MAX_SPECIES_BONUS_PERCENT = 10.0;
export const BONUS_PERCENT_PER_LEVEL = 0.1; // 0.1% per level

/**
 * Building Cost Formula (multiplied by target level L, distinct from standard buildings):
 * Cost(L) = floor(baseCost * factor^(L-1) * L * (1 - CostReductionBonus))
 */
export function calculateBuildingCost(
  baseCost: number,
  factor: number,
  targetLevel: number,
  costReductionBonus: number = 0.0
): number {
  if (baseCost <= 0 || targetLevel <= 0) return 0;
  const reduction = Math.min(0.99, Math.max(0.0, costReductionBonus));
  const cost = baseCost * Math.pow(factor, targetLevel - 1) * targetLevel * (1.0 - reduction);
  return Math.max(1, Math.floor(cost));
}

/**
 * Building Energy Consumption:
 * Energy(L) = floor(L * energyBase * factor^L)
 */
export function calculateBuildingEnergy(
  energyBase: number,
  factor: number,
  targetLevel: number
): number {
  if (energyBase <= 0 || targetLevel <= 0) return 0;
  const energy = targetLevel * energyBase * Math.pow(factor, targetLevel);
  return Math.floor(energy);
}

/**
 * Building Construction Duration (seconds):
 * T_building(L) = floor(L * durationBase * durationFactor^L / ((1 + RoboticsLvl) * 2^NaniteLvl * EcoSpeed))
 */
export function calculateBuildingDuration(
  targetLevel: number,
  durationBase: number = 12.0,
  durationFactor: number = 1.22,
  roboticsLevel: number = 0,
  naniteLevel: number = 0,
  ecoSpeed: number = 1.0
): number {
  if (targetLevel <= 0) return 1;
  const speed = Math.max(1.0, ecoSpeed);
  const denom = (1.0 + Math.max(0, roboticsLevel)) * Math.pow(2.0, Math.max(0, naniteLevel)) * speed;
  const rawSeconds = (targetLevel * durationBase * Math.pow(durationFactor, targetLevel)) / denom;
  return Math.max(1, Math.floor(rawSeconds));
}

/**
 * Superlinear Building Bonus:
 * Bonus_building(L) = L^increaseFactor * (baseValue / 100)
 */
export function calculateBuildingBonus(
  level: number,
  increaseFactor: number = 1.05,
  baseValue: number = 1.0
): number {
  if (level <= 0) return 0.0;
  return Math.pow(level, increaseFactor) * (baseValue / 100.0);
}

/**
 * Tech Research Cost:
 * TechCost(L) = floor(baseCost * factor^(L-1) * L * (1 - ResearchCenterCostReduction))
 */
export function calculateTechCost(
  baseCost: number,
  factor: number,
  targetLevel: number,
  researchCenterCostReduction: number = 0.0
): number {
  if (baseCost <= 0 || targetLevel <= 0) return 0;
  const reduction = Math.min(0.99, Math.max(0.0, researchCenterCostReduction));
  const cost = baseCost * Math.pow(factor, targetLevel - 1) * targetLevel * (1.0 - reduction);
  return Math.max(1, Math.floor(cost));
}

/**
 * Tech Research Duration (seconds):
 * T_tech(L) = floor(L * durationBase * durationFactor^L * (1 - ResearchCenterTimeReduction))
 */
export function calculateTechDuration(
  targetLevel: number,
  durationBase: number = 30.0,
  durationFactor: number = 1.25,
  researchCenterTimeReduction: number = 0.0
): number {
  if (targetLevel <= 0) return 1;
  const reduction = Math.min(0.99, Math.max(0.0, researchCenterTimeReduction));
  const rawSeconds = (targetLevel * durationBase * Math.pow(durationFactor, targetLevel)) * (1.0 - reduction);
  return Math.max(1, Math.floor(rawSeconds));
}

/**
 * Total Empire Lifeform Tech Bonus:
 * TotalTechBonus = BaseTechBonus(L) * (1 + SpeciesLevelBonus + PlanetMetropolisBonus)
 */
export function calculateTotalTechBonus(
  baseTechBonus: number,
  speciesLevelBonus: number = 0.0,
  planetMetropolisBonus: number = 0.0
): number {
  const multiplier = 1.0 + Math.max(0.0, speciesLevelBonus) + Math.max(0.0, planetMetropolisBonus);
  return baseTechBonus * multiplier;
}

/**
 * Species Experience Level Bonus:
 * Max Level 100. +0.1% per level (+10% max at Level 100).
 * Returns fractional bonus (e.g. level 10 => 0.01 = 1%, level 100 => 0.10 = 10%).
 */
export function calculateSpeciesLevelBonus(level: number): number {
  const clamped = Math.min(MAX_SPECIES_LEVEL, Math.max(0, level));
  return (clamped * BONUS_PERCENT_PER_LEVEL) / 100.0;
}

/**
 * Experience award rule:
 * Beyond Level 100, species discoveries award 0 XP (retaining Artefacts/Highscore).
 */
export function calculateAwardedXp(currentLevel: number, earnedXp: number): number {
  if (currentLevel >= MAX_SPECIES_LEVEL) return 0;
  return Math.max(0, earnedXp);
}

// ==========================================
// Building Caps (Hard Caps)
// ==========================================

/**
 * Rock'tal Rune Technologium: Max -25% research cost reduction.
 */
export function capRuneTechnologiumCostReduction(rawReduction: number): number {
  return Math.min(0.25, Math.max(0.0, rawReduction));
}

/**
 * Rock'tal Rune Technologium: Max -99% research duration reduction.
 */
export function capRuneTechnologiumTimeReduction(rawReduction: number): number {
  return Math.min(0.99, Math.max(0.0, rawReduction));
}

/**
 * Rock'tal Rune Forge, Deuterium Synthesiser, and Advanced Recycling Plant: Max 50% bonus.
 */
export function capRocktalBonus(rawBonus: number): number {
  return Math.min(0.50, Math.max(0.0, rawBonus));
}

/**
 * Kaelesh Psionic Modulator: Reduces population threshold for the 18 tech slots by up to -25%.
 */
export function capPsionicModulatorReduction(rawReduction: number): number {
  return Math.min(0.25, Math.max(0.0, rawReduction));
}

/**
 * Calculates effective population requirement for a tech slot with Psionic Modulator reduction.
 */
export function calculateEffectivePopulationThreshold(
  baseThreshold: number,
  psionicModulatorReduction: number = 0.0
): number {
  const reduction = capPsionicModulatorReduction(psionicModulatorReduction);
  return Math.floor(baseThreshold * (1.0 - reduction));
}

/**
 * Kaelesh Ship Manufacturing Hall: Shortens shipyard build time by up to -70%.
 */
export function capShipManufacturingHallReduction(rawReduction: number): number {
  return Math.min(0.70, Math.max(0.0, rawReduction));
}

/**
 * Kaelesh Supra Refractor: Increases max Moon creation chance up to 30% and max Moon diameter up to 9,400 km.
 */
export function calculateSupraRefractorMoonBonus(
  baseMaxChance: number = 20.0,
  baseMaxDiameter: number = 8944,
  supraRefractorChanceBonus: number = 0.0,
  supraRefractorDiameterBonus: number = 0
): { maxMoonChance: number; maxMoonDiameter: number } {
  const maxMoonChance = Math.min(30.0, baseMaxChance + Math.max(0.0, supraRefractorChanceBonus));
  const maxMoonDiameter = Math.min(9400, baseMaxDiameter + Math.max(0, supraRefractorDiameterBonus));
  return { maxMoonChance, maxMoonDiameter };
}

/**
 * Kaelesh Bio Modifier gives extra planet fields (+1 per level).
 */
export function calculateBioModifierFields(bioModifierLevel: number): number {
  return Math.max(0, bioModifierLevel);
}

/**
 * Planet building construction restriction rule:
 * When switching away from Kaelesh, Bio Modifier extra fields are removed.
 * If usedFields >= maxFields, new standard building construction is blocked.
 */
export function canConstructStandardBuilding(usedFields: number, maxFields: number): boolean {
  return usedFields < maxFields;
}

/**
 * Tier Pause Rule:
 * If Tier 1 or Tier 2 is reset, upper tier bonuses are temporarily paused
 * until all 6 slots in that tier are selected again!
 * (Tier 1 is always active. Tier 2 active if tier1Filled == 6. Tier 3 active if tier1Filled == 6 && tier2Filled == 6).
 */
export function isTierActive(
  tier: 1 | 2 | 3,
  tier1FilledSlots: number,
  tier2FilledSlots: number
): boolean {
  if (tier === 1) return true;
  if (tier === 2) return tier1FilledSlots >= 6;
  return tier1FilledSlots >= 6 && tier2FilledSlots >= 6;
}

