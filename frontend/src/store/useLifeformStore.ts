/**
 * useLifeformStore.ts
 *
 * Manages Lifeform Species Experience (XP) & Levels (Max Level 100 / +10% Bonus),
 * Technology Tier slot assignments, Tier Pause state, and 60-Minute Tier Restore snapshots.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_SPECIES_LEVEL,
  BONUS_PERCENT_PER_LEVEL,
  isTierActive,
} from '@/services/lifeformMathService';

export type LifeformSpeciesId = 'humans' | 'rocktal' | 'mechas' | 'kaelesh';

export interface SpeciesExperienceState {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface SlotChoice {
  slot: number;
  techId: string;
  level: number;
}

export interface TierRestoreSnapshot {
  tier: 1 | 2 | 3;
  slots: Record<number, SlotChoice>;
  restoreExpiresAt: number; // Unix timestamp in ms (60 minutes from reset)
}

export interface PlanetLifeformStoreData {
  planetId: string;
  slots: Record<number, SlotChoice>;
  freeResetCooldownUntil: Record<number, number>; // tier -> timestamp in ms
  tierRestoreSnapshots: Record<number, TierRestoreSnapshot>; // tier -> snapshot
}

interface LifeformStoreState {
  speciesProgress: Record<LifeformSpeciesId, SpeciesExperienceState>;
  planetData: Record<string, PlanetLifeformStoreData>;

  // XP & Level Actions
  addSpeciesXp: (speciesId: LifeformSpeciesId, gainedXp: number) => { levelUp: boolean; newLevel: number };
  getSpeciesBonusPercent: (speciesId: LifeformSpeciesId) => number;

  // Tier Management & Slot Actions
  getPlanetData: (planetId: string) => PlanetLifeformStoreData;
  setSlotChoice: (planetId: string, slot: number, techId: string, level?: number) => void;
  isTierPaused: (planetId: string, tier: 1 | 2 | 3) => boolean;

  // Reset & 60-Minute Restore Actions
  freeResetTier: (planetId: string, tier: 1 | 2 | 3) => boolean;
  dmResetTier: (planetId: string, tier: 1 | 2 | 3, dmCost?: number) => boolean;
  restoreTier: (planetId: string, tier: 1 | 2 | 3) => boolean;
  getTierRestoreSnapshot: (planetId: string, tier: 1 | 2 | 3) => TierRestoreSnapshot | null;
}

const TIER_SLOT_RANGES: Record<1 | 2 | 3, [number, number]> = {
  1: [1, 6],
  2: [7, 12],
  3: [13, 18],
};

function getRequiredXpForNextLevel(level: number): number {
  if (level >= MAX_SPECIES_LEVEL) return 0;
  return Math.floor(100 * Math.pow(1.08, level));
}

function getDefaultPlanetData(planetId: string): PlanetLifeformStoreData {
  const slots: Record<number, SlotChoice> = {};
  // Default Human slots 1-6 pre-configured
  for (let s = 1; s <= 6; s++) {
    slots[s] = { slot: s, techId: `human_tech_${s}`, level: 0 };
  }

  return {
    planetId,
    slots,
    freeResetCooldownUntil: {},
    tierRestoreSnapshots: {},
  };
}

export const useLifeformStore = create<LifeformStoreState>()(
  persist(
    (set, get) => ({
      speciesProgress: {
        humans: { level: 10, xp: 200, xpToNextLevel: getRequiredXpForNextLevel(10) },
        rocktal: { level: 1, xp: 0, xpToNextLevel: getRequiredXpForNextLevel(1) },
        mechas: { level: 1, xp: 0, xpToNextLevel: getRequiredXpForNextLevel(1) },
        kaelesh: { level: 1, xp: 0, xpToNextLevel: getRequiredXpForNextLevel(1) },
      },
      planetData: {},

      addSpeciesXp: (speciesId, gainedXp) => {
        const current = get().speciesProgress[speciesId] ?? {
          level: 1,
          xp: 0,
          xpToNextLevel: getRequiredXpForNextLevel(1),
        };

        // Rule: Beyond level 100, award 0 XP
        if (current.level >= MAX_SPECIES_LEVEL || gainedXp <= 0) {
          return { levelUp: false, newLevel: current.level };
        }

        let newLevel = current.level;
        let newXp = current.xp + gainedXp;
        let reqXp = current.xpToNextLevel;
        let levelUp = false;

        while (newLevel < MAX_SPECIES_LEVEL && reqXp > 0 && newXp >= reqXp) {
          newXp -= reqXp;
          newLevel++;
          levelUp = true;
          reqXp = getRequiredXpForNextLevel(newLevel);
        }

        if (newLevel >= MAX_SPECIES_LEVEL) {
          newXp = 0;
          reqXp = 0;
        }

        set((state) => ({
          speciesProgress: {
            ...state.speciesProgress,
            [speciesId]: {
              level: newLevel,
              xp: newXp,
              xpToNextLevel: reqXp,
            },
          },
        }));

        return { levelUp, newLevel };
      },

      getSpeciesBonusPercent: (speciesId) => {
        const progress = get().speciesProgress[speciesId];
        if (!progress) return 0;
        const clampedLevel = Math.min(MAX_SPECIES_LEVEL, Math.max(0, progress.level));
        return Math.round(clampedLevel * BONUS_PERCENT_PER_LEVEL * 10) / 10;
      },

      getPlanetData: (planetId) => {
        const data = get().planetData[planetId];
        return data ?? getDefaultPlanetData(planetId);
      },

      setSlotChoice: (planetId, slot, techId, level = 0) => {
        set((state) => {
          const currentPlanet = state.planetData[planetId] ?? getDefaultPlanetData(planetId);
          return {
            planetData: {
              ...state.planetData,
              [planetId]: {
                ...currentPlanet,
                slots: {
                  ...currentPlanet.slots,
                  [slot]: { slot, techId, level },
                },
              },
            },
          };
        });
      },

      isTierPaused: (planetId, tier) => {
        const planet = get().getPlanetData(planetId);
        const slots = planet.slots;

        let tier1Count = 0;
        for (let s = 1; s <= 6; s++) {
          if (slots[s]?.techId) tier1Count++;
        }

        let tier2Count = 0;
        for (let s = 7; s <= 12; s++) {
          if (slots[s]?.techId) tier2Count++;
        }

        const active = isTierActive(tier, tier1Count, tier2Count);
        return !active;
      },

      freeResetTier: (planetId, tier) => {
        const planet = get().getPlanetData(planetId);
        const [minSlot, maxSlot] = TIER_SLOT_RANGES[tier];

        // Check cooldown
        const cooldownUntil = planet.freeResetCooldownUntil[tier] ?? 0;
        if (Date.now() < cooldownUntil) {
          return false;
        }

        // Snapshot current slots for 60-minute restore
        const snapshotSlots: Record<number, SlotChoice> = {};
        let filledCount = 0;
        for (let s = minSlot; s <= maxSlot; s++) {
          if (planet.slots[s]) {
            snapshotSlots[s] = { ...planet.slots[s] };
            if (planet.slots[s].techId) filledCount++;
          }
        }

        const restoreExpiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes
        // Cooldown: 15 minutes per active slot, minimum 30 minutes
        const cooldownMinutes = Math.max(30, filledCount * 15);
        const newCooldownUntil = Date.now() + cooldownMinutes * 60 * 1000;

        const newSlots = { ...planet.slots };
        for (let s = minSlot; s <= maxSlot; s++) {
          delete newSlots[s];
        }

        set((state) => ({
          planetData: {
            ...state.planetData,
            [planetId]: {
              ...planet,
              slots: newSlots,
              freeResetCooldownUntil: {
                ...planet.freeResetCooldownUntil,
                [tier]: newCooldownUntil,
              },
              tierRestoreSnapshots: {
                ...planet.tierRestoreSnapshots,
                [tier]: {
                  tier,
                  slots: snapshotSlots,
                  restoreExpiresAt,
                },
              },
            },
          },
        }));

        return true;
      },

      dmResetTier: (planetId, tier, _dmCost = 1000) => {
        const planet = get().getPlanetData(planetId);
        const [minSlot, maxSlot] = TIER_SLOT_RANGES[tier];

        // Snapshot current slots for 60-minute restore
        const snapshotSlots: Record<number, SlotChoice> = {};
        for (let s = minSlot; s <= maxSlot; s++) {
          if (planet.slots[s]) {
            snapshotSlots[s] = { ...planet.slots[s] };
          }
        }

        const restoreExpiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes
        const newSlots = { ...planet.slots };
        for (let s = minSlot; s <= maxSlot; s++) {
          delete newSlots[s];
        }

        set((state) => ({
          planetData: {
            ...state.planetData,
            [planetId]: {
              ...planet,
              slots: newSlots,
              // Instant reset: clears any free cooldown as well
              freeResetCooldownUntil: {
                ...planet.freeResetCooldownUntil,
                [tier]: 0,
              },
              tierRestoreSnapshots: {
                ...planet.tierRestoreSnapshots,
                [tier]: {
                  tier,
                  slots: snapshotSlots,
                  restoreExpiresAt,
                },
              },
            },
          },
        }));

        return true;
      },

      restoreTier: (planetId, tier) => {
        const planet = get().getPlanetData(planetId);
        const snapshot = planet.tierRestoreSnapshots[tier];

        if (!snapshot || Date.now() > snapshot.restoreExpiresAt) {
          return false;
        }

        const newSlots = { ...planet.slots, ...snapshot.slots };
        const newSnapshots = { ...planet.tierRestoreSnapshots };
        delete newSnapshots[tier];

        set((state) => ({
          planetData: {
            ...state.planetData,
            [planetId]: {
              ...planet,
              slots: newSlots,
              tierRestoreSnapshots: newSnapshots,
            },
          },
        }));

        return true;
      },

      getTierRestoreSnapshot: (planetId, tier) => {
        const planet = get().getPlanetData(planetId);
        const snapshot = planet.tierRestoreSnapshots[tier];
        if (!snapshot || Date.now() > snapshot.restoreExpiresAt) {
          return null;
        }
        return snapshot;
      },
    }),
    {
      name: 'ogame_lifeforms_store',
    }
  )
);

