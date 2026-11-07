import {
  UNIT_BASE_COSTS,
  type HonorRank,
  type FightHonorableStatus,
  isBandit,
} from "./honorPointsService";

export interface TacticalRetreatResult {
  canRetreat: boolean;
  triggered: boolean;
  attackerTacticalPoints: number;
  defenderTacticalPoints: number;
  requiredRatio: number;
  requiredDeuteriumFuel: number;
  hasEnoughFuel: boolean;
  retreatingUnits: Record<number, number>;
  remainingUnitsInBattle: Record<number, number>;
}

export interface ReaperDebrisSkimResult {
  skimmedMetal: number;
  skimmedCrystal: number;
  remainingDebrisMetal: number;
  remainingDebrisCrystal: number;
  survivingReaperCount: number;
  availableCargoCapacity: number;
}

const SHIP_BASE_FUEL_USAGE: Record<number, number> = {
  202: 10,   // Small Cargo
  203: 50,   // Large Cargo
  204: 20,   // Light Fighter
  205: 75,   // Heavy Fighter
  206: 300,  // Cruiser
  207: 500,  // Battleship
  208: 1000, // Colony Ship
  209: 300,  // Recycler
  210: 1,    // Espionage Probe
  211: 1000, // Bomber
  213: 1000, // Destroyer
  214: 1,    // Deathstar
  215: 250,  // Battlecruiser
  218: 1100, // Reaper (Azrail)
  219: 300,  // Pathfinder
};

/**
 * Calculates tactical fleet power points for Tactical Retreat calculation:
 * Warships = 100% cost, Civilian ships = 25% cost, Defenses/Probes/Satellites = 0%.
 */
export function calculateFleetTacticalPoints(units: Record<number, number>): number {
  let total = 0;

  for (const [keyStr, count] of Object.entries(units)) {
    const unitType = Number(keyStr);
    if (count <= 0) continue;

    // Excluded from tactical points
    if (unitType === 210 || unitType === 212 || unitType === 217 || (unitType >= 401 && unitType <= 408)) {
      continue;
    }

    const costs = UNIT_BASE_COSTS[unitType];
    if (!costs) continue;

    const unitCost = costs.metal + costs.crystal + costs.deuterium;

    // Civilian ships count for 25%
    if (unitType === 202 || unitType === 203 || unitType === 208 || unitType === 209) {
      total += count * unitCost * 0.25;
    } else {
      total += count * unitCost * 1.0;
    }
  }

  return total;
}

/**
 * Checks if a unit can retreat.
 * Deathstar (214), Solar Satellite (212), Espionage Probe (210), and Defenses cannot retreat.
 */
export function canUnitTacticallyRetreat(unitType: number): boolean {
  if (unitType === 214 || unitType === 212 || unitType === 210) {
    return false;
  }
  return !(unitType >= 401 && unitType <= 503);
}

/**
 * Calculates 1.5x Deuterium flight fuel cost for neighbor slot flight (distance = 1005).
 */
export function calculateRetreatDeuteriumFuel(ships: Record<number, number>): number {
  let totalFuel = 0;
  const neighborDistance = 1005;

  for (const [keyStr, count] of Object.entries(ships)) {
    const unitType = Number(keyStr);
    if (count <= 0 || !canUnitTacticallyRetreat(unitType)) continue;

    const baseFuel = SHIP_BASE_FUEL_USAGE[unitType] ?? 100;
    const flightFuel = 1 + Math.round(count * baseFuel * (1 + neighborDistance / 35000) * 0.1);
    totalFuel += flightFuel;
  }

  return Math.ceil(totalFuel * 1.5);
}

/**
 * Evaluates whether Tactical Retreat triggers for the defender.
 */
export function evaluateTacticalRetreat(params: {
  defenderTotalPoints: number;
  status: FightHonorableStatus;
  defenderHonorRank: HonorRank;
  attackerUnits: Record<number, number>;
  defenderUnits: Record<number, number>;
  availablePlanetDeuterium: number;
  hasAdmiralOfficer?: boolean;
  fleetRetreatRatio3To1Enabled?: boolean;
  isAcsDefendFleet?: boolean;
}): TacticalRetreatResult {
  const retreatingUnits: Record<number, number> = {};
  const remainingUnitsInBattle: Record<number, number> = {};

  for (const [keyStr, count] of Object.entries(params.defenderUnits)) {
    const uType = Number(keyStr);
    if (count <= 0) continue;

    if (canUnitTacticallyRetreat(uType)) {
      retreatingUnits[uType] = count;
    } else {
      remainingUnitsInBattle[uType] = count;
    }
  }

  if (params.isAcsDefendFleet || Object.keys(retreatingUnits).length === 0) {
    return {
      canRetreat: false,
      triggered: false,
      attackerTacticalPoints: 0,
      defenderTacticalPoints: 0,
      requiredRatio: 5.0,
      requiredDeuteriumFuel: 0,
      hasEnoughFuel: false,
      retreatingUnits: {},
      remainingUnitsInBattle: { ...params.defenderUnits },
    };
  }

  const isUnderNoobProtection = params.defenderTotalPoints < 500000;
  const isNotHonorable = params.status !== "Honorable";
  const isNotBandit = !isBandit(params.defenderHonorRank);
  const canRetreat = isUnderNoobProtection && isNotHonorable && isNotBandit;

  const attackerTactical = calculateFleetTacticalPoints(params.attackerUnits);
  const defenderTactical = calculateFleetTacticalPoints(params.defenderUnits);

  const requiredRatio =
    params.hasAdmiralOfficer && params.fleetRetreatRatio3To1Enabled ? 3.0 : 5.0;

  const ratioMet = defenderTactical > 0 && attackerTactical / defenderTactical >= requiredRatio;
  const requiredFuel = calculateRetreatDeuteriumFuel(retreatingUnits);
  const hasEnoughFuel = params.availablePlanetDeuterium >= requiredFuel;

  const triggered = canRetreat && ratioMet && hasEnoughFuel;

  return {
    canRetreat,
    triggered,
    attackerTacticalPoints: attackerTactical,
    defenderTacticalPoints: defenderTactical,
    requiredRatio,
    requiredDeuteriumFuel: requiredFuel,
    hasEnoughFuel,
    retreatingUnits: triggered ? retreatingUnits : {},
    remainingUnitsInBattle: triggered ? remainingUnitsInBattle : { ...params.defenderUnits },
  };
}

/**
 * Calculates 25% debris field auto-skimming by surviving Reaper ships.
 */
export function calculateReaperDebrisSkim(params: {
  survivingReapers: number;
  newlyCreatedDebrisMetal: number;
  newlyCreatedDebrisCrystal: number;
  existingReaperCargoLoad?: number;
}): ReaperDebrisSkimResult {
  const {
    survivingReapers,
    newlyCreatedDebrisMetal,
    newlyCreatedDebrisCrystal,
    existingReaperCargoLoad = 0,
  } = params;

  if (survivingReapers <= 0 || (newlyCreatedDebrisMetal <= 0 && newlyCreatedDebrisCrystal <= 0)) {
    return {
      skimmedMetal: 0,
      skimmedCrystal: 0,
      remainingDebrisMetal: newlyCreatedDebrisMetal,
      remainingDebrisCrystal: newlyCreatedDebrisCrystal,
      survivingReaperCount: survivingReapers,
      availableCargoCapacity: 0,
    };
  }

  const totalReaperCapacity = survivingReapers * 10000;
  const availableCapacity = Math.max(0, totalReaperCapacity - existingReaperCargoLoad);

  if (availableCapacity <= 0) {
    return {
      skimmedMetal: 0,
      skimmedCrystal: 0,
      remainingDebrisMetal: newlyCreatedDebrisMetal,
      remainingDebrisCrystal: newlyCreatedDebrisCrystal,
      survivingReaperCount: survivingReapers,
      availableCargoCapacity: 0,
    };
  }

  const targetMetal = newlyCreatedDebrisMetal * 0.25;
  const targetCrystal = newlyCreatedDebrisCrystal * 0.25;
  const targetTotal = targetMetal + targetCrystal;

  let skimmedMetal = targetMetal;
  let skimmedCrystal = targetCrystal;

  if (targetTotal > availableCapacity) {
    const ratio = availableCapacity / targetTotal;
    skimmedMetal = targetMetal * ratio;
    skimmedCrystal = targetCrystal * ratio;
  }

  return {
    skimmedMetal: Math.floor(skimmedMetal),
    skimmedCrystal: Math.floor(skimmedCrystal),
    remainingDebrisMetal: Math.max(0, newlyCreatedDebrisMetal - Math.floor(skimmedMetal)),
    remainingDebrisCrystal: Math.max(0, newlyCreatedDebrisCrystal - Math.floor(skimmedCrystal)),
    survivingReaperCount: survivingReapers,
    availableCargoCapacity: availableCapacity,
  };
}

