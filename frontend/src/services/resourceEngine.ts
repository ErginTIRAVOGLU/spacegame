import {
  getSlotProductionMultipliers,
  HOMEWORLD_FIELDS,
  calculateMaxColonies,
  calculateMaxPlanets,
  applyColonyFieldBonuses,
  getTerraformerFieldsGranted,
} from "./planetGenerationService";

export {
  HOMEWORLD_FIELDS,
  calculateMaxColonies,
  calculateMaxPlanets,
  applyColonyFieldBonuses,
  getTerraformerFieldsGranted,
};

export const BASE_PRODUCTION = {
  metal: 30,
  crystal: 15,
  deuterium: 0,
};

export const PLASMA_BONUS = {
  metalPerLevel: 0.01,
  crystalPerLevel: 0.0066,
  deuteriumPerLevel: 0.0033,
};

export function calculateMetalMineBase(
  level: number,
  slot: number = 0,
  ecoSpeed: number = 1
): number {
  if (level <= 0) return 0;
  const { metal: slotMultiplier } = getSlotProductionMultipliers(slot);
  return (
    Math.floor(30 * level * Math.pow(1.1, level) * slotMultiplier) * ecoSpeed
  );
}

export function calculateCrystalMineBase(
  level: number,
  slot: number = 0,
  ecoSpeed: number = 1
): number {
  if (level <= 0) return 0;
  const { crystal: slotMultiplier } = getSlotProductionMultipliers(slot);
  return (
    Math.floor(20 * level * Math.pow(1.1, level) * slotMultiplier) * ecoSpeed
  );
}

export function calculateDeuteriumSynthesizerBase(
  level: number,
  tempMax: number = 40,
  ecoSpeed: number = 1
): number {
  if (level <= 0) return 0;
  const tempFactor = Math.max(0, 1.44 - 0.004 * tempMax);
  return Math.floor(10 * level * Math.pow(1.1, level) * tempFactor) * ecoSpeed;
}

export function calculatePlasmaProductionBonus(plasmaLevel: number) {
  return {
    metalBonus: plasmaLevel * PLASMA_BONUS.metalPerLevel,
    crystalBonus: plasmaLevel * PLASMA_BONUS.crystalPerLevel,
    deuteriumBonus: plasmaLevel * PLASMA_BONUS.deuteriumPerLevel,
  };
}

export function calculateMaxActiveCrawlers(
  metalLvl: number,
  crystalLvl: number,
  deutLvl: number,
  playerClass: string = "None",
  hasGeologist: boolean = false
): number {
  const sum = Math.max(0, metalLvl) + Math.max(0, crystalLvl) + Math.max(0, deutLvl);
  const geologistMultiplier =
    playerClass === "Collector" && hasGeologist ? 1.1 : 1.0;
  return Math.floor(sum * 8 * geologistMultiplier);
}

export function calculateCrawlerBoostPerUnit(
  playerClass: string = "None",
  percent: number = 100
): number {
  const ratio = Math.max(0, percent) / 100.0;
  if (playerClass !== "Collector") {
    return 0.0002 * Math.min(1.0, ratio);
  }
  return 0.0002 * ratio * 1.5;
}

export function calculateCrawlerEnergyPerUnit(percent: number = 100): number {
  if (percent <= 100) return 50;
  const steps = Math.min(5, Math.floor((percent - 100) / 10));
  return 50 + steps * 10;
}

export function calculateCrawlerEnergyConsumption(
  activeCrawlers: number,
  percent: number = 100
): number {
  return Math.max(0, activeCrawlers) * calculateCrawlerEnergyPerUnit(percent);
}

export function calculateDemolitionCost(
  baseCost: { metal: number; crystal: number; deuterium: number },
  factor: number,
  level: number,
  ionTechLevel: number = 0
) {
  if (level <= 0) {
    return { metal: 0, crystal: 0, deuterium: 0 };
  }
  const discountFactor = Math.max(0, 1.0 - 0.04 * ionTechLevel);
  const levelMult = Math.pow(factor, level - 1);
  return {
    metal: Math.floor(baseCost.metal * levelMult * discountFactor),
    crystal: Math.floor(baseCost.crystal * levelMult * discountFactor),
    deuterium: Math.floor(baseCost.deuterium * levelMult * discountFactor),
  };
}

