export type HonorRank =
  | "GrandEmperor"
  | "Emperor"
  | "StarLord"
  | "None"
  | "Bandit"
  | "BanditLord"
  | "BanditKing";

export type FightHonorableStatus = "Honorable" | "Dishonorable" | "Neutral";

export const CIVILIAN_UNIT_TYPES = new Set<number>([
  202, // Small Cargo
  203, // Large Cargo
  208, // Colony Ship
  209, // Recycler
  210, // Espionage Probe
  212, // Solar Satellite
  217, // Crawler
]);

export const UNIT_BASE_COSTS: Record<number, { metal: number; crystal: number; deuterium: number }> = {
  // Warships
  204: { metal: 3000, crystal: 1000, deuterium: 0 },       // Light Fighter
  205: { metal: 6000, crystal: 4000, deuterium: 0 },       // Heavy Fighter
  206: { metal: 20000, crystal: 7000, deuterium: 2000 },    // Cruiser
  207: { metal: 45000, crystal: 15000, deuterium: 0 },     // Battleship
  211: { metal: 50000, crystal: 25000, deuterium: 15000 }, // Bomber
  213: { metal: 60000, crystal: 50000, deuterium: 15000 }, // Destroyer
  214: { metal: 5000000, crystal: 4000000, deuterium: 1000000 }, // Deathstar
  215: { metal: 30000, crystal: 40000, deuterium: 15000 }, // Battlecruiser
  218: { metal: 85000, crystal: 55000, deuterium: 20000 }, // Reaper (Azrail)
  219: { metal: 8000, crystal: 15000, deuterium: 8000 },   // Pathfinder

  // Civilian
  202: { metal: 2000, crystal: 2000, deuterium: 0 },       // Small Cargo
  203: { metal: 6000, crystal: 6000, deuterium: 0 },       // Large Cargo
  208: { metal: 10000, crystal: 20000, deuterium: 10000 }, // Colony Ship
  209: { metal: 10000, crystal: 6000, deuterium: 2000 },   // Recycler
  210: { metal: 0, crystal: 1000, deuterium: 0 },          // Espionage Probe
  212: { metal: 0, crystal: 2000, deuterium: 500 },        // Solar Satellite
  217: { metal: 2000, crystal: 2000, deuterium: 1000 },    // Crawler

  // Defenses
  401: { metal: 2000, crystal: 0, deuterium: 0 },          // Rocket Launcher
  402: { metal: 1500, crystal: 500, deuterium: 0 },        // Light Laser
  403: { metal: 6000, crystal: 2000, deuterium: 0 },       // Heavy Laser
  404: { metal: 20000, crystal: 15000, deuterium: 2000 },  // Gauss Cannon
  405: { metal: 2000, crystal: 6000, deuterium: 0 },       // Ion Cannon
  406: { metal: 50000, crystal: 50000, deuterium: 30000 }, // Plasma Turret
  407: { metal: 10000, crystal: 10000, deuterium: 0 },     // Small Shield Dome
  408: { metal: 50000, crystal: 50000, deuterium: 0 },     // Large Shield Dome
};

/**
 * Calculates raw Honor Points from destroyed military units value:
 * HP = floor((DestroyedMilitaryUnitsValue)^0.9 / 1000)
 */
export function calculateHonorPointsFromDestroyedValue(destroyedMilitaryValue: number): number {
  if (destroyedMilitaryValue <= 0) return 0;
  return Math.floor(Math.pow(destroyedMilitaryValue, 0.9) / 1000);
}

/**
 * Calculates the structural resource value of destroyed military units.
 * Excludes civilian ships and repaired defenses.
 */
export function calculateDestroyedMilitaryUnitsValue(
  destroyedUnits: Record<number, number>,
  repairedDefenses?: Record<number, number>
): number {
  let total = 0;
  for (const [keyStr, destroyedCount] of Object.entries(destroyedUnits)) {
    const unitType = Number(keyStr);
    if (destroyedCount <= 0 || CIVILIAN_UNIT_TYPES.has(unitType)) continue;

    let permanentlyDestroyed = destroyedCount;
    if (repairedDefenses && repairedDefenses[unitType]) {
      permanentlyDestroyed = Math.max(0, destroyedCount - repairedDefenses[unitType]);
    }
    if (permanentlyDestroyed <= 0) continue;

    const costs = UNIT_BASE_COSTS[unitType];
    if (costs) {
      const unitCost = costs.metal + costs.crystal + costs.deuterium;
      total += permanentlyDestroyed * unitCost;
    }
  }
  return total;
}

/**
 * Evaluates Honor Rank based on positive/negative HP and leaderboard position.
 */
export function determineHonorRank(
  hp: number,
  rankPosition: number,
  totalPlayers: number = 1000
): HonorRank {
  if (hp >= 15000 && rankPosition <= 10) return "GrandEmperor";
  if (hp >= 2500 && rankPosition <= 100) return "Emperor";
  if (hp >= 500 && rankPosition <= 250) return "StarLord";

  const bottomThreshold = Math.max(1, totalPlayers);
  if (hp <= -15000 && rankPosition >= bottomThreshold - 9) return "BanditKing";
  if (hp <= -2500 && rankPosition >= bottomThreshold - 99) return "BanditLord";
  if (hp <= -500 && rankPosition >= bottomThreshold - 249) return "Bandit";

  return "None";
}

export function isBandit(rank: HonorRank): boolean {
  return rank === "Bandit" || rank === "BanditLord" || rank === "BanditKing";
}

export function isStarlordOrHigher(rank: HonorRank): boolean {
  return rank === "StarLord" || rank === "Emperor" || rank === "GrandEmperor";
}

/**
 * Evaluates 1v1 Honorable Fight Conditions.
 */
export function evaluate1v1FightHonorableStatus(params: {
  attackerMilitaryPoints: number;
  attackerMilitaryRank: number;
  defenderMilitaryPoints: number;
  defenderMilitaryRank: number;
  defenderHonorRank: HonorRank;
  isSameAlliance?: boolean;
  isFriend?: boolean;
  isDefenderInactive?: boolean;
}): FightHonorableStatus {
  if (params.isSameAlliance || params.isFriend || params.isDefenderInactive) {
    return "Neutral";
  }

  if (
    params.attackerMilitaryPoints <= params.defenderMilitaryPoints ||
    params.defenderMilitaryPoints >= params.attackerMilitaryPoints - 10 ||
    params.defenderMilitaryRank - params.attackerMilitaryRank <= 100 ||
    isBandit(params.defenderHonorRank)
  ) {
    return "Honorable";
  }

  return "Dishonorable";
}

/**
 * Evaluates dynamic plunder percentage (50%, 75%, 100%).
 */
export function determinePlunderRatio(params: {
  status: FightHonorableStatus;
  defenderHonorRank: HonorRank;
  isDefenderInactive?: boolean;
  attackerClass?: string;
}): number {
  if (isBandit(params.defenderHonorRank)) {
    return 1.0; // 100% against Bandits
  }
  if (params.status === "Honorable") {
    return 0.75; // 75% for Honorable targets
  }
  if (params.isDefenderInactive && params.attackerClass === "Discoverer") {
    return 0.75; // 75% for Discoverer on inactives
  }
  return 0.5; // 50% standard
}

/**
 * Calculates Auctioneer bid valuation:
 * Total = (Metal * 1) + (Crystal * 1.5) + (Deut * 3) + (HonorPoints * 100)
 */
export function calculateAuctionBidValue(
  metal: number,
  crystal: number,
  deuterium: number,
  honorPoints: number = 0
): number {
  const resourceValue =
    Math.max(0, metal) * 1.0 +
    Math.max(0, crystal) * 1.5 +
    Math.max(0, deuterium) * 3.0;
  const honorValue = Math.max(0, honorPoints) * 100.0;
  return Math.floor(resourceValue + honorValue);
}

