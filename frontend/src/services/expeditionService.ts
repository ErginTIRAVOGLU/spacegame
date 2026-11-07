/**
 * Sidian Wiki Expedition Engine (16. Pozisyon / Sonsuz Uzaklar)
 *
 * Implements Sidian OGame Wiki expedition rules:
 * - Astrophysics & Class expedition slot limits
 * - Expedition points per ship (Deathstar, Colony Ship, Recycler barred)
 * - Pathfinder (Rehber) 2.0x multiplier on resources and ships found
 * - Scaled BaseCap based on top player score and fleet expedition points
 * - 10 exact event weights with system depletion shifting
 * - Kaelesh tech bonuses (Enhanced Sensor, Sixth Sense, Telekinetic Tractor, Gravitation Sensors, Psionic Network)
 * - Pirate & Alien fleet generation with -3 / +3 combat tech offsets
 */

import { DepletionLevel } from './systemDepletionService';

export type ExpeditionOutcome =
  | 'FindResources'
  | 'FindShips'
  | 'NothingHappens'
  | 'FindDarkMatter'
  | 'Delay'
  | 'Pirates'
  | 'Aliens'
  | 'EarlyReturn'
  | 'FindMerchant'
  | 'TotalBlackHoleLoss'
  | 'FindLifeform';

export interface CombatTechLevels {
  weapons: number;
  shielding: number;
  armour: number;
}

export interface ExpeditionFindResult {
  metal: number;
  crystal: number;
  deuterium: number;
  shipPoints: number;
  pathfinderMultiplier: number;
}

export const EXPEDITION_SHIP_POINTS: Record<number, number> = {
  210: 5,   // Espionage Probe (Casus Sondası)
  204: 20,  // Light Fighter (Hafif Avcı)
  202: 20,  // Small Cargo (Küçük Nakliye)
  205: 50,  // Heavy Fighter (Ağır Avcı)
  203: 60,  // Large Cargo (Büyük Nakliye)
  206: 135, // Cruiser (Kruvazör)
  207: 300, // Battleship (Komuta Gemisi)
  215: 350, // Battlecruiser (Fırkateyn)
  211: 375, // Bomber (Bombardıman Gemisi)
  213: 550, // Destroyer (Muhrip)
  219: 115, // Pathfinder (Rehber)
  218: 700, // Reaper (Azrail)
  214: 0,   // Deathstar (Ölüm Yıldızı) - Excluded
  208: 0,   // Colony Ship (Koloni Gemisi) - Excluded
  209: 0,   // Recycler (Geri Dönüşümcü) - Excluded
  212: 0,   // Solar Satellite - Excluded
  217: 0,   // Crawler - Excluded
};

/**
 * Checks whether a unit type is permitted to take part in expedition missions.
 * Deathstar, Colony Ship, and Recycler cannot participate.
 */
export function canShipParticipateInExpedition(unitType: number): boolean {
  return unitType !== 214 && unitType !== 208 && unitType !== 209 && unitType !== 212 && unitType !== 217;
}

/**
 * Returns the individual expedition point value of a ship.
 */
export function getShipExpeditionPoints(unitType: number): number {
  return EXPEDITION_SHIP_POINTS[unitType] ?? 0;
}

/**
 * Computes maximum concurrent expeditions:
 * MaxExpeditions = floor(sqrt(AstrophysicsLevel)) + AdmiralBonus[1] + DiscovererBonus[2] + BuffSlots
 */
export function calculateMaxExpeditions(
  astrophysicsLevel: number,
  hasAdmiral: boolean = false,
  playerClass: string = 'None',
  extraBuffSlots: number = 0
): number {
  const baseSlots = astrophysicsLevel > 0 ? Math.floor(Math.sqrt(astrophysicsLevel)) : 0;
  const admiralBonus = hasAdmiral ? 1 : 0;
  const isDiscoverer = playerClass.toLowerCase() === 'discoverer';
  const discovererBonus = isDiscoverer ? 2 : 0;

  return baseSlots + admiralBonus + discovererBonus + Math.max(0, extraBuffSlots);
}

/**
 * Computes total expedition points for the fleet, ignoring disqualified ship types.
 */
export function calculateFleetExpeditionPoints(ships: Record<number, number>): number {
  let total = 0;
  for (const [keyStr, count] of Object.entries(ships)) {
    const unitType = Number(keyStr);
    if (count <= 0 || !canShipParticipateInExpedition(unitType)) continue;
    total += count * getShipExpeditionPoints(unitType);
  }
  return total;
}

/**
 * Pathfinder (Rehber) Multiplier:
 * If the fleet has at least 1 Pathfinder ship (219), found resources and ships are doubled (2.0x).
 */
export function getPathfinderMultiplier(ships: Record<number, number>): number {
  return (ships[219] ?? 0) > 0 ? 2.0 : 1.0;
}

/**
 * Calculates BaseCap for expedition resource rewards, scaled by #1 player score and fleet expedition points.
 */
export function calculateBaseCapByTopPlayerScore(
  topPlayerScore: number,
  fleetExpeditionPoints: number
): number {
  let topCap = 1_200_000;
  if (topPlayerScore < 10_000) topCap = 12_000;
  else if (topPlayerScore < 100_000) topCap = 24_000;
  else if (topPlayerScore < 1_000_000) topCap = 60_000;
  else if (topPlayerScore < 5_000_000) topCap = 120_000;
  else if (topPlayerScore < 25_000_000) topCap = 300_000;
  else if (topPlayerScore < 100_000_000) topCap = 600_000;

  // Fleet Cap = FleetPoints * 20
  const fleetCap = Math.max(12_000, fleetExpeditionPoints * 20);
  return Math.min(topCap, fleetCap);
}

/**
 * Resolves the expedition event outcome from the 10 exact event weights,
 * shifting favorable event weights into NothingHappens when depleted.
 *
 * 1. FindResources (32.5%)
 * 2. FindShips (22.0%)
 * 3. NothingHappens (18.6%)
 * 4. FindDarkMatter (9.0%)
 * 5. Delay (7.0%)
 * 6. Pirates (5.8%)
 * 7. Aliens (2.6%)
 * 8. EarlyReturn (2.0%)
 * 9. FindMerchant (0.7%)
 * 10. TotalBlackHoleLoss (0.33%)
 */
export function resolveExpeditionOutcome(
  rollPercentile: number, // 0 - 100
  depletionLevel: DepletionLevel = 'Undepleted',
  psionicNetworkReduction: number = 0.0,
  allowLifeformDiscovery: boolean = false
): ExpeditionOutcome {
  let resWeight = 32.5;
  let shipsWeight = 22.0;
  let nothingWeight = 18.6;
  let dmWeight = 9.0;
  const delayWeight = 7.0;
  const piratesWeight = 5.8;
  const aliensWeight = 2.6;
  const earlyReturnWeight = 2.0;
  const merchantWeight = 0.7;
  const blackHoleWeight = Math.max(0.05, 0.33 * (1.0 - Math.min(0.80, Math.max(0, psionicNetworkReduction))));

  // Shift favorable events into Nothing when depleted
  const shiftRatio = depletionLevel === 'CompletelyDepleted'
    ? 0.40
    : depletionLevel === 'SlightlyDepleted'
    ? 0.15
    : 0.0;

  if (shiftRatio > 0.0) {
    const favorableTotal = resWeight + shipsWeight + dmWeight;
    const shiftedAmount = favorableTotal * shiftRatio;
    resWeight *= (1.0 - shiftRatio);
    shipsWeight *= (1.0 - shiftRatio);
    dmWeight *= (1.0 - shiftRatio);
    nothingWeight += shiftedAmount;
  }

  const lifeformWeight = allowLifeformDiscovery ? 8.63 : 0.0;
  if (allowLifeformDiscovery && nothingWeight > lifeformWeight) {
    nothingWeight -= lifeformWeight;
  }

  const totalWeight =
    resWeight +
    shipsWeight +
    nothingWeight +
    dmWeight +
    delayWeight +
    piratesWeight +
    aliensWeight +
    earlyReturnWeight +
    merchantWeight +
    blackHoleWeight +
    lifeformWeight;

  const roll = Math.min(100.0, Math.max(0.0, rollPercentile));
  const target = (roll / 100.0) * totalWeight;

  let cumulative = 0.0;

  cumulative += resWeight;
  if (target <= cumulative) return 'FindResources';

  cumulative += shipsWeight;
  if (target <= cumulative) return 'FindShips';

  cumulative += nothingWeight;
  if (target <= cumulative) return 'NothingHappens';

  cumulative += dmWeight;
  if (target <= cumulative) return 'FindDarkMatter';

  cumulative += delayWeight;
  if (target <= cumulative) return 'Delay';

  cumulative += piratesWeight;
  if (target <= cumulative) return 'Pirates';

  cumulative += aliensWeight;
  if (target <= cumulative) return 'Aliens';

  cumulative += earlyReturnWeight;
  if (target <= cumulative) return 'EarlyReturn';

  cumulative += merchantWeight;
  if (target <= cumulative) return 'FindMerchant';

  if (allowLifeformDiscovery) {
    cumulative += lifeformWeight;
    if (target <= cumulative) return 'FindLifeform';
  }

  return 'TotalBlackHoleLoss';
}

/**
 * Calculates found resource amounts or ship conversion points:
 * MetalFound = U[0.1, 1.0] * BaseCap * EcoSpeed * k_class * k_pathfinder * (1 + TechBonus)
 * Crystal = MetalFound * (2 / 3)
 * Deuterium = MetalFound * (1 / 3)
 */
export function calculateExpeditionFind(params: {
  resourceTypeChoice?: number; // 0 = Metal, 1 = Crystal, 2 = Deuterium
  roll01?: number; // 0.1 to 1.0
  baseCap: number;
  ecoSpeed?: number;
  classMultiplier?: number;
  pathfinderMultiplier?: number;
  techBonus?: number;
}): ExpeditionFindResult {
  const {
    resourceTypeChoice = 0,
    roll01 = 1.0,
    baseCap,
    ecoSpeed = 1.0,
    classMultiplier = 1.0,
    pathfinderMultiplier = 1.0,
    techBonus = 0.0,
  } = params;

  const clampedRoll = Math.min(1.0, Math.max(0.1, roll01));
  const effectiveMultiplier =
    Math.max(1.0, ecoSpeed) *
    Math.max(1.0, classMultiplier) *
    Math.max(1.0, pathfinderMultiplier) *
    (1.0 + Math.max(0.0, techBonus));

  const baseMetalFound = Math.floor(clampedRoll * baseCap * effectiveMultiplier);

  let metal = 0;
  let crystal = 0;
  let deuterium = 0;

  if (resourceTypeChoice === 1) {
    crystal = Math.floor(baseMetalFound * (2 / 3));
  } else if (resourceTypeChoice === 2) {
    deuterium = Math.floor(baseMetalFound * (1 / 3));
  } else {
    metal = baseMetalFound;
  }

  const shipPoints = Math.floor(baseMetalFound / 2);

  return {
    metal,
    crystal,
    deuterium,
    shipPoints,
    pathfinderMultiplier,
  };
}

/**
 * Awards 300 to 1,800 Dark Matter based on packet tier:
 * - Small packet (< 0.60): 300 - 400 KM
 * - Medium packet (0.60 - 0.90): 500 - 700 KM
 * - Large packet (>= 0.90): 1,000 - 1,800 KM
 * Multiplied by Kaelesh Gravitation Sensors bonus.
 */
export function calculateDarkMatterFind(
  rngFactor: number = 0.5,
  gravitationSensorsBonus: number = 0.0,
  packetRoll: number = 0.0
): number {
  const factor = Math.min(1.0, Math.max(0.0, rngFactor));
  let baseDm = 300 + factor * 100;

  if (packetRoll >= 0.90) {
    baseDm = 1000 + factor * 800; // 1,000 to 1,800
  } else if (packetRoll >= 0.60) {
    baseDm = 500 + factor * 200; // 500 to 700
  }

  const total = baseDm * (1.0 + Math.max(0.0, gravitationSensorsBonus));
  return Math.round(total);
}

/**
 * Generates hostile Pirate or Alien fleet with specified tech scaling:
 * - Pirates: Tech = max(0, PlayerTech - 3), Fleet = 30% - 80%
 * - Aliens: Tech = PlayerTech + 3, Fleet = 40% - 120%
 */
export function generateHostileFleet(
  playerShips: Record<number, number>,
  isAlien: boolean,
  playerTech: CombatTechLevels,
  fleetScaleRoll: number = 0.5
): { npcFleet: Record<number, number>; npcTech: CombatTechLevels } {
  const scale = isAlien
    ? 0.40 + Math.min(1.0, Math.max(0.0, fleetScaleRoll)) * 0.80 // 40% to 120%
    : 0.30 + Math.min(1.0, Math.max(0.0, fleetScaleRoll)) * 0.50; // 30% to 80%

  const techOffset = isAlien ? 3 : -3;
  const npcTech: CombatTechLevels = {
    weapons: Math.max(0, playerTech.weapons + techOffset),
    shielding: Math.max(0, playerTech.shielding + techOffset),
    armour: Math.max(0, playerTech.armour + techOffset),
  };

  const npcFleet: Record<number, number> = {};
  for (const [keyStr, count] of Object.entries(playerShips)) {
    const shipType = Number(keyStr);
    if (count <= 0 || !canShipParticipateInExpedition(shipType)) continue;
    npcFleet[shipType] = Math.max(1, Math.round(count * scale));
  }

  if (Object.keys(npcFleet).length === 0) {
    npcFleet[204] = isAlien ? 5 : 3; // Light Fighter fallback
  }

  return { npcFleet, npcTech };
}

