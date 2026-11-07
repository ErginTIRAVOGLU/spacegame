export interface SlotMetadata {
  slot: number;
  minFields: number;
  maxFields: number;
  meanFields: number;
  tempMin: number;
  tempMax: number;
  metalMultiplier: number;
  crystalMultiplier: number;
  bonusDescription: string;
  astrophysicsLevelRequired: number;
  relocationRestrictedTo4_12: boolean;
}

export const HOMEWORLD_FIELDS = 163;

export const SLOT_METADATA_TABLE: Record<number, SlotMetadata> = {
  1: {
    slot: 1,
    minFields: 96,
    maxFields: 172,
    meanFields: 134,
    tempMin: 220,
    tempMax: 260,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.4,
    bonusDescription: "+%40 Kristal",
    astrophysicsLevelRequired: 8,
    relocationRestrictedTo4_12: false,
  },
  2: {
    slot: 2,
    minFields: 104,
    maxFields: 176,
    meanFields: 140,
    tempMin: 170,
    tempMax: 210,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.3,
    bonusDescription: "+%30 Kristal",
    astrophysicsLevelRequired: 6,
    relocationRestrictedTo4_12: false,
  },
  3: {
    slot: 3,
    minFields: 112,
    maxFields: 182,
    meanFields: 147,
    tempMin: 120,
    tempMax: 160,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.2,
    bonusDescription: "+%20 Kristal",
    astrophysicsLevelRequired: 4,
    relocationRestrictedTo4_12: false,
  },
  4: {
    slot: 4,
    minFields: 118,
    maxFields: 208,
    meanFields: 163,
    tempMin: 70,
    tempMax: 110,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Standart",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  5: {
    slot: 5,
    minFields: 133,
    maxFields: 232,
    meanFields: 182,
    tempMin: 60,
    tempMax: 100,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Standart",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  6: {
    slot: 6,
    minFields: 146,
    maxFields: 242,
    meanFields: 194,
    tempMin: 50,
    tempMax: 90,
    metalMultiplier: 1.17,
    crystalMultiplier: 1.0,
    bonusDescription: "+%17 Metal",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  7: {
    slot: 7,
    minFields: 152,
    maxFields: 248,
    meanFields: 200,
    tempMin: 40,
    tempMax: 80,
    metalMultiplier: 1.23,
    crystalMultiplier: 1.0,
    bonusDescription: "+%23 Metal",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  8: {
    slot: 8,
    minFields: 156,
    maxFields: 252,
    meanFields: 204,
    tempMin: 30,
    tempMax: 70,
    metalMultiplier: 1.35,
    crystalMultiplier: 1.0,
    bonusDescription: "+%35 Metal",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  9: {
    slot: 9,
    minFields: 150,
    maxFields: 246,
    meanFields: 198,
    tempMin: 20,
    tempMax: 60,
    metalMultiplier: 1.23,
    crystalMultiplier: 1.0,
    bonusDescription: "+%23 Metal",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  10: {
    slot: 10,
    minFields: 142,
    maxFields: 232,
    meanFields: 187,
    tempMin: 10,
    tempMax: 50,
    metalMultiplier: 1.17,
    crystalMultiplier: 1.0,
    bonusDescription: "+%17 Metal",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  11: {
    slot: 11,
    minFields: 136,
    maxFields: 210,
    meanFields: 173,
    tempMin: 0,
    tempMax: 40,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Standart",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  12: {
    slot: 12,
    minFields: 125,
    maxFields: 186,
    meanFields: 156,
    tempMin: -10,
    tempMax: 30,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Standart",
    astrophysicsLevelRequired: 1,
    relocationRestrictedTo4_12: true,
  },
  13: {
    slot: 13,
    minFields: 114,
    maxFields: 172,
    meanFields: 143,
    tempMin: -50,
    tempMax: -10,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Yüksek Deuterium",
    astrophysicsLevelRequired: 4,
    relocationRestrictedTo4_12: false,
  },
  14: {
    slot: 14,
    minFields: 100,
    maxFields: 168,
    meanFields: 134,
    tempMin: -90,
    tempMax: -50,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "Çok Yüksek Deuterium",
    astrophysicsLevelRequired: 6,
    relocationRestrictedTo4_12: false,
  },
  15: {
    slot: 15,
    minFields: 90,
    maxFields: 164,
    meanFields: 127,
    tempMin: -130,
    tempMax: -90,
    metalMultiplier: 1.0,
    crystalMultiplier: 1.0,
    bonusDescription: "En Yüksek Deuterium",
    astrophysicsLevelRequired: 8,
    relocationRestrictedTo4_12: false,
  },
};

export function getSlotMetadata(slot: number): SlotMetadata {
  return (
    SLOT_METADATA_TABLE[slot] ?? {
      slot,
      minFields: 118,
      maxFields: 208,
      meanFields: 163,
      tempMin: 0,
      tempMax: 40,
      metalMultiplier: 1.0,
      crystalMultiplier: 1.0,
      bonusDescription: "Standart",
      astrophysicsLevelRequired: 1,
      relocationRestrictedTo4_12: slot >= 4 && slot <= 12,
    }
  );
}

export function getSlotProductionMultipliers(slot: number): {
  metal: number;
  crystal: number;
} {
  const meta = getSlotMetadata(slot);
  return {
    metal: meta.metalMultiplier,
    crystal: meta.crystalMultiplier,
  };
}

export function canRelocateToSlot(fromSlot: number, toSlot: number): boolean {
  if (toSlot < 1 || toSlot > 15) return false;
  const isFromStandard = fromSlot >= 4 && fromSlot <= 12;
  const isToStandard = toSlot >= 4 && toSlot <= 12;
  return isFromStandard ? isToStandard : true;
}

export function canColonizeSlot(slot: number, astrophysicsLevel: number): boolean {
  const meta = getSlotMetadata(slot);
  return astrophysicsLevel >= meta.astrophysicsLevelRequired;
}

export function calculateMaxColonies(astrophysicsLevel: number): number {
  if (astrophysicsLevel <= 0) return 0;
  return Math.floor((astrophysicsLevel + 1) / 2);
}

export function calculateMaxPlanets(astrophysicsLevel: number): number {
  return calculateMaxColonies(astrophysicsLevel) + 1;
}

export function applyColonyFieldBonuses(
  baseFields: number,
  isDiscoverer: boolean,
  isResearcherAlliance: boolean = false
): number {
  let fields = baseFields;
  if (isDiscoverer) {
    fields = Math.floor(fields * 1.1);
  }
  if (isResearcherAlliance) {
    fields = Math.floor(fields * 1.05);
  }
  return fields;
}

export function getTerraformerFieldsGranted(level: number): {
  totalGranted: number;
  netGain: number;
} {
  if (level <= 0) return { totalGranted: 0, netGain: 0 };
  let totalGranted = 0;
  for (let i = 1; i <= level; i++) {
    totalGranted += i % 2 === 1 ? 6 : 5;
  }
  const netGain = totalGranted - level;
  return { totalGranted, netGain };
}

