/**
 * lifeformMechanicsService.ts
 * Official Sidian OGame Wiki Mechanics, Constants, and Verification Logic for Lifeforms (Canlı Türleri).
 * Covers the 4 species synergies, 18-slot population thresholds, Artefacts system, exploration rules,
 * mutual upgrade locks (Nanite & Research Centre), species change rules, and tier resets.
 */

import { LifeformId } from "@/lib/lifeformsCatalog";

export interface SpeciesClassSynergy {
  speciesId: LifeformId;
  synergyClass: "Balanced" | "Collector" | "General" | "Discoverer";
  synergyTitleTr: string;
  specializationTr: string;
  isDefaultUnlocked: boolean;
  discoveryRequired: boolean;
}

export const LIFEFORM_SPECIES_SYNERGIES: Record<LifeformId, SpeciesClassSynergy> = {
  humans: {
    speciesId: "humans",
    synergyClass: "Balanced",
    synergyTitleTr: "Sınıf Bağımsız (Dengeli)",
    specializationTr: "Diğer canlı türlerini keşfetme (Galaksiler Arası Elçiler), dengeli maden üretimi ve savaş gemisi bonusları.",
    isDefaultUnlocked: true,
    discoveryRequired: false,
  },
  rocktal: {
    speciesId: "rocktal",
    synergyClass: "Collector",
    synergyTitleTr: "Koleksiyoncu (Collector)",
    specializationTr: "Metal, Kristal, Deuterium üretimi; enerji üretimi; bina maliyeti indirimi ve savunma.",
    isDefaultUnlocked: false,
    discoveryRequired: true,
  },
  mechas: {
    speciesId: "mechas",
    synergyClass: "General",
    synergyTitleTr: "General",
    specializationTr: "Gemi revizyonları (saldırı/kalkan/zırh), filo hızı, yakıt tasarrufu, tersane hızı, Deuterium üretimi.",
    isDefaultUnlocked: false,
    discoveryRequired: true,
  },
  kaelesh: {
    speciesId: "kaelesh",
    synergyClass: "Discoverer",
    synergyTitleTr: "Kaşif (Discoverer)",
    specializationTr: "Keşif (Sefer) ödülleri, Ay oluşumu, gezegen alanları (fields), sensör falanks menzili ve araştırma hızı.",
    isDefaultUnlocked: false,
    discoveryRequired: true,
  },
};

/**
 * Official Sidian OGame Wiki 18 Technology Slot Population Requirements.
 * Uniform across all 4 species.
 */
export const TECH_SLOT_POPULATION_THRESHOLDS: Record<number, number> = {
  1: 200_000,
  2: 300_000,
  3: 400_000,
  4: 500_000,
  5: 750_000,
  6: 1_000_000,
  7: 1_200_000,
  8: 3_000_000,
  9: 5_000_000,
  10: 7_000_000,
  11: 9_000_000,
  12: 11_000_000,
  13: 13_000_000,
  14: 26_000_000,
  15: 56_000_000,
  16: 112_000_000,
  17: 224_000_000,
  18: 448_000_000,
};

/**
 * Artefact (Eser) System rules and costs
 */
export const ARTEFACT_RULES = {
  tier1Cost: 200,
  tier2Cost: 400,
  tier3Cost: 600,
  maxStorageCap: 3_600,
} as const;

/**
 * Exploration (Keşif) flight rules (Galaxy View - Purple DNA icon)
 */
export const EXPLORATION_FLIGHT_RULES = {
  prerequisiteTech: "intergalacticEnvoys",
  prerequisiteMinLevel: 1,
  shipCountRequired: 0,
  freeFleetSlotsRequired: 1,
  cost: {
    metal: 5_000,
    crystal: 1_000,
    deuterium: 500,
  },
  dailyAllotment: 50,
  coordinateCooldownDays: 7,
  maxSpeciesLevel: 100,
  maxBonusPercent: 10.0,
  bonusPercentPerLevel: 0.1,
} as const;

/**
 * Planet species switch rules
 */
export const SPECIES_SWITCH_RULES = {
  cooldownHours: 48,
  resetsPopulation: true,
  resetsFood: true,
  preservesBuildingLevels: true,
  preservesTechLevels: true,
} as const;

/**
 * Research Centre building keys across all species
 */
export const RESEARCH_CENTRE_KEYS = [
  "researchCentre",
  "researchCenter",
  "runeTechnologium",
  "runeTechnologicalInstitute",
  "roboticsResearchCentre",
  "coreMatrix",
  "vortexChamber",
  "cosmicResonator",
] as const;

export function getSlotTier(slot: number): 1 | 2 | 3 {
  if (slot >= 1 && slot <= 6) return 1;
  if (slot >= 7 && slot <= 12) return 2;
  return 3;
}

export function getRequiredPopulationForSlot(slot: number): number {
  return TECH_SLOT_POPULATION_THRESHOLDS[slot] ?? 200_000;
}

export function getArtefactCostForSlot(slot: number): number {
  const tier = getSlotTier(slot);
  if (tier === 1) return ARTEFACT_RULES.tier1Cost;
  if (tier === 2) return ARTEFACT_RULES.tier2Cost;
  return ARTEFACT_RULES.tier3Cost;
}

export function isTechSlotUnlocked(slot: number, currentPopulation: number): boolean {
  const required = getRequiredPopulationForSlot(slot);
  return currentPopulation >= required;
}

/**
 * Tier gating: To unlock Tier 2, all 6 slots in Tier 1 must be chosen/filled.
 * To unlock Tier 3, all 6 slots in Tier 2 must be chosen/filled.
 */
export function isTierUnlocked(tier: 1 | 2 | 3, filledSlots: number[]): boolean {
  if (tier === 1) return true;
  if (tier === 2) {
    const tier1Slots = [1, 2, 3, 4, 5, 6];
    return tier1Slots.every((s) => filledSlots.includes(s));
  }
  // Tier 3
  const tier2Slots = [7, 8, 9, 10, 11, 12];
  return tier2Slots.every((s) => filledSlots.includes(s));
}

/**
 * Mutual lock: While Nanite Factory is upgrading on the planet, lifeform buildings cannot be built/upgraded.
 */
export function canUpgradeLifeformBuilding(hasNaniteUnderConstruction: boolean): {
  canUpgrade: boolean;
  reason?: string;
} {
  if (hasNaniteUnderConstruction) {
    return {
      canUpgrade: false,
      reason: "Nanit Fabrikası geliştirilirken Canlı Türü binası inşa edilemez.",
    };
  }
  return { canUpgrade: true };
}

/**
 * Mutual lock: While a lifeform building is under construction, Nanite Factory cannot be upgraded.
 */
export function canUpgradeNaniteFactory(hasLifeformBuildingUnderConstruction: boolean): {
  canUpgrade: boolean;
  reason?: string;
} {
  if (hasLifeformBuildingUnderConstruction) {
    return {
      canUpgrade: false,
      reason: "Canlı Türü binası inşa edilirken Nanit Fabrikası geliştirilemez.",
    };
  }
  return { canUpgrade: true };
}

/**
 * Mutual lock: While a lifeform tech is being researched, Research Centre cannot be upgraded.
 */
export function canUpgradeResearchCentre(hasLifeformResearchUnderway: boolean): {
  canUpgrade: boolean;
  reason?: string;
} {
  if (hasLifeformResearchUnderway) {
    return {
      canUpgrade: false,
      reason: "Canlı Türü araştırması devam ederken Araştırma Merkezi geliştirilemez.",
    };
  }
  return { canUpgrade: true };
}

/**
 * Mutual lock: While Research Centre is being upgraded, lifeform tech research cannot be initiated.
 */
export function canStartLifeformResearch(
  hasResearchCentreUnderConstruction: boolean,
  activeTechQueueExists: boolean
): {
  canResearch: boolean;
  reason?: string;
} {
  if (activeTechQueueExists) {
    return {
      canResearch: false,
      reason: "Bu gezegende zaten aktif bir teknoloji araştırması var.",
    };
  }
  if (hasResearchCentreUnderConstruction) {
    return {
      canResearch: false,
      reason: "Araştırma Merkezi geliştirilirken Canlı Türü araştırması başlatılamaz.",
    };
  }
  return { canResearch: true };
}

/**
 * Check if discovery flight can be dispatched to target coordinate.
 */
export function canDispatchDiscoveryFlight(
  envoysLevel: number,
  freeFleetSlots: number,
  resources: { metal: number; crystal: number; deuterium: number },
  lastScoutedAt?: string | Date | null
): {
  canDispatch: boolean;
  reason?: string;
  cooldownRemainingHours?: number;
} {
  if (envoysLevel < EXPLORATION_FLIGHT_RULES.prerequisiteMinLevel) {
    return {
      canDispatch: false,
      reason: "Canlı türü keşif uçuşu için Galaksiler Arası Elçiler araştırması en az 1. seviye olmalıdır.",
    };
  }
  if (freeFleetSlots < EXPLORATION_FLIGHT_RULES.freeFleetSlotsRequired) {
    return {
      canDispatch: false,
      reason: "Keşif uçuşu için en az 1 boş filo slotu gereklidir.",
    };
  }
  if (
    resources.metal < EXPLORATION_FLIGHT_RULES.cost.metal ||
    resources.crystal < EXPLORATION_FLIGHT_RULES.cost.crystal ||
    resources.deuterium < EXPLORATION_FLIGHT_RULES.cost.deuterium
  ) {
    return {
      canDispatch: false,
      reason: "Yetersiz hammadde (Gereken: 5.000 Metal, 1.000 Kristal, 500 Deuterium).",
    };
  }

  if (lastScoutedAt) {
    const scoutedDate = typeof lastScoutedAt === "string" ? new Date(lastScoutedAt) : lastScoutedAt;
    const now = new Date();
    const diffMs = now.getTime() - scoutedDate.getTime();
    const cooldownMs = EXPLORATION_FLIGHT_RULES.coordinateCooldownDays * 24 * 60 * 60 * 1000;
    if (diffMs < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - diffMs) / (1000 * 60 * 60));
      return {
        canDispatch: false,
        reason: `Bu koordinat son 7 gün içinde keşfedildi. Bekleme süresi: ${remainingHours} saat.`,
        cooldownRemainingHours: remainingHours,
      };
    }
  }

  return { canDispatch: true };
}

/**
 * Calculate species bonus from experience level (Max 100, +0.1% per level, max +10%)
 */
export function calculateSpeciesBonus(level: number): number {
  const clampedLevel = Math.max(0, Math.min(EXPLORATION_FLIGHT_RULES.maxSpeciesLevel, level));
  return Math.round(clampedLevel * EXPLORATION_FLIGHT_RULES.bonusPercentPerLevel * 10) / 10;
}

/**
 * Handle artefact finding with 3,600 storage cap and bulk overflow exception.
 */
export function calculateArtefactAward(currentArtefacts: number, foundArtefacts: number): number {
  if (currentArtefacts >= ARTEFACT_RULES.maxStorageCap) {
    return currentArtefacts;
  }
  // Allows bulk discovery to push above 3600 on the final find
  return currentArtefacts + foundArtefacts;
}

/**
 * Species change cooldown evaluation
 */
export function canSwitchSpecies(
  currentSpecies: string | null | undefined,
  targetSpecies: string,
  lastSwitchAt?: string | Date | null
): {
  canSwitch: boolean;
  reason?: string;
  remainingCooldownHours?: number;
} {
  if (!currentSpecies || currentSpecies === "none" || currentSpecies === "Durduruldu") {
    return { canSwitch: true };
  }
  if (currentSpecies.toLowerCase() === targetSpecies.toLowerCase()) {
    return { canSwitch: false, reason: "Bu canlı türü zaten bu gezegende aktif." };
  }
  if (lastSwitchAt) {
    const switchDate = typeof lastSwitchAt === "string" ? new Date(lastSwitchAt) : lastSwitchAt;
    const now = new Date();
    const diffMs = now.getTime() - switchDate.getTime();
    const cooldownMs = SPECIES_SWITCH_RULES.cooldownHours * 60 * 60 * 1000;
    if (diffMs < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - diffMs) / (1000 * 60 * 60));
      return {
        canSwitch: false,
        reason: `Canlı türü değişimleri arasında 48 saat bekleme süresi vardır. Kalan: ${remainingHours} saat.`,
        remainingCooldownHours: remainingHours,
      };
    }
  }
  return { canSwitch: true };
}

