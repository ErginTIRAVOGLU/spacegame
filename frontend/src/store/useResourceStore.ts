import { create } from "zustand";
import {
  type PlanetSummary,
  calculateStorageCapacity,
  calculateSolarSatelliteUnitEnergy,
  calculateFusionReactorEnergy,
  calculateFusionReactorDeuteriumConsumption,
  useGameStore,
} from "./useGameStore";
import { useOfficerStore } from "./useOfficerStore";
import { type PlanetLifeformStateDto } from "@/lib/lifeformsCatalog";

export interface LifeformPopulationMetrics {
  current: number;
  t2: number;
  t3: number;
  housing: number;
  fed: number;
  underfed: number;
  growthRate: string;
  shelterCapacity: number;
}

export interface LifeformFoodMetrics {
  current: number;
  capacity: number;
  surplus: number;
  consumption: number;
  consumptionTimeRemaining: string;
}

export interface DarkMatterMetrics {
  total: number;
  purchased: number;
  found: number;
}

export interface MineralMetrics {
  current: number;
  capacity: number;
  isFull: boolean;
  hourlyProduction: number;
  bunkerCapacity: number;
  fusionDeuteriumConsumption?: number;
}

export interface EnergyMetrics {
  current: number;
  produced: number;
  consumed: number;
  solarPlantEnergy: number;
  fusionReactorEnergy: number;
  solarSatelliteEnergy: number;
  fusionDeuteriumConsumption: number;
  hasDeuteriumForFusion: boolean;
  fusionLevel: number;
}

export interface ResourceStoreState {
  lifeformStates: Record<string, PlanetLifeformStateDto>;
  purchasedDarkMatter: number;
  setPurchasedDarkMatter: (amount: number) => void;
  getPlanetLifeformState: (planetId: string) => PlanetLifeformStateDto;
  fetchPlanetLifeforms: (planetId: string) => Promise<void>;
  setPlanetLifeformState: (
    planetId: string,
    state: Partial<PlanetLifeformStateDto>
  ) => void;
  getMineralMetrics: (
    planet: PlanetSummary,
    type: "metal" | "crystal" | "deuterium",
    liveAmount: number
  ) => MineralMetrics;
  getEnergyMetrics: (planet: PlanetSummary) => EnergyMetrics;
  getPopulationMetrics: (planetId: string) => LifeformPopulationMetrics;
  getFoodMetrics: (planetId: string) => LifeformFoodMetrics;
  getDarkMatterMetrics: (currentDarkMatter: number) => DarkMatterMetrics;
}

export function createDefaultPlanetLifeform(
  planetId: string,
  isCapital: boolean = true
): PlanetLifeformStateDto {
  if (!isCapital) {
    return {
      planetId,
      activeSpecies: "none",
      isActive: false,
      speciesLevel: 0,
      currentXp: 0,
      maxXp: 900,
      techBonusPercent: 0,
      artifactCount: 0,
      maxArtifacts: 3600,
      t1Population: 0,
      t2Population: 0,
      t3Population: 0,
      maxPopulation: 0,
      foodBalance: 0,
      maxFoodCapacity: 0,
      foodPerSecond: 0,
      protectedPopulation: 0,
      maxProtectedCapacity: 0,
      buildingLevels: {
        residentialSector: 0,
        biosphereFarm: 0,
        researchCentre: 0,
      },
      techLevels: {},
      speciesBuildingLevels: {},
      speciesTechLevels: {},
      slotSpecies: {},
      unlockedSpecies: ["humans"],
      activeQueue: null,
      activeTechQueue: null,
    };
  }

  return {
    planetId,
    activeSpecies: "İnsanlar",
    isActive: true,
    speciesLevel: 1,
    currentXp: 150,
    maxXp: 1000,
    techBonusPercent: 0,
    artifactCount: 420,
    maxArtifacts: 3600,
    t1Population: 250,
    t2Population: 0,
    t3Population: 0,
    maxPopulation: 300,
    foodBalance: 840,
    maxFoodCapacity: 2600,
    foodPerSecond: 24,
    protectedPopulation: 0,
    maxProtectedCapacity: 100,
    buildingLevels: {
      residentialSector: 2,
      biosphereFarm: 2,
      researchCentre: 1,
      academyOfSciences: 0,
      neuroCalibrationCentre: 0,
      highEnergySmelting: 0,
      foodSilo: 0,
      fusionPoweredProduction: 0,
      skyscraper: 0,
      biotechLab: 0,
      metropolis: 0,
      planetaryShield: 0,
    },
    techLevels: {},
    speciesBuildingLevels: {},
    speciesTechLevels: {},
    slotSpecies: {
      1: "humans",
      2: "humans",
      3: "humans",
      4: "humans",
      5: "humans",
      6: "humans",
      7: "humans",
      8: "humans",
      9: "humans",
      10: "humans",
      11: "humans",
      12: "humans",
      13: "humans",
      14: "humans",
      15: "humans",
      16: "humans",
      17: "humans",
      18: "humans",
    },
    unlockedSpecies: ["humans"],
    activeQueue: null,
    activeTechQueue: null,
  };
}

export const useResourceStore = create<ResourceStoreState>((set, get) => ({
  lifeformStates: {},
  purchasedDarkMatter: 0,

  setPurchasedDarkMatter: (amount: number) =>
    set({ purchasedDarkMatter: Math.max(0, amount) }),

  fetchPlanetLifeforms: async (planetId: string) => {
    if (!planetId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}/api/planets/${planetId}/lifeforms`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as PlanetLifeformStateDto;
        set((state) => ({
          lifeformStates: { ...state.lifeformStates, [planetId]: data },
        }));
      }
    } catch {
      // Fallback
    }
  },

  getPlanetLifeformState: (planetId: string) => {
    const existing = get().lifeformStates[planetId];
    if (existing) return existing;
    const planet = useGameStore.getState().planets.find((p) => p.id === planetId);
    const isCapital = planet ? planet.isCapital : true;
    const defaultState = createDefaultPlanetLifeform(planetId, isCapital);
    set((state) => ({
      lifeformStates: { ...state.lifeformStates, [planetId]: defaultState },
    }));
    // Trigger async sync in the background
    void get().fetchPlanetLifeforms(planetId);
    return defaultState;
  },

  setPlanetLifeformState: (planetId: string, partial: Partial<PlanetLifeformStateDto>) => {
    set((state) => {
      const planet = useGameStore.getState().planets.find((p) => p.id === planetId);
      const isCapital = planet ? planet.isCapital : true;
      const cur = state.lifeformStates[planetId] ?? createDefaultPlanetLifeform(planetId, isCapital);
      return {
        lifeformStates: {
          ...state.lifeformStates,
          [planetId]: { ...cur, ...partial },
        },
      };
    });
  },

  getMineralMetrics: (planet, type, liveAmount) => {
    let storageLevel = 0;
    let baseHourlyProduction = 0;
    let fusionDeuteriumConsumption: number | undefined;

    if (type === "metal") {
      const b = planet.buildings.find(
        (x) => x.key === "metalStorage" || x.buildingType === 22
      );
      storageLevel = b?.level ?? 0;
      baseHourlyProduction = planet.metalPerHour;
    } else if (type === "crystal") {
      const b = planet.buildings.find(
        (x) => x.key === "crystalStorage" || x.buildingType === 23
      );
      storageLevel = b?.level ?? 0;
      baseHourlyProduction = planet.crystalPerHour;
    } else if (type === "deuterium") {
      const b = planet.buildings.find(
        (x) => x.key === "deuteriumTank" || x.buildingType === 24
      );
      storageLevel = b?.level ?? 0;
      baseHourlyProduction = planet.deuteriumPerHour;

      const fusionLevel =
        planet.buildings.find((x) => x.key === "fusionReactor" || x.buildingType === 5)?.level ?? 0;
      const fusionPercent = planet.resourceSettings?.fusionReactorPercent ?? 100;
      const hasDeuteriumForFusion =
        fusionLevel > 0 && (planet.deuterium > 0 || planet.deuteriumPerHour > 0);
      fusionDeuteriumConsumption = hasDeuteriumForFusion
        ? calculateFusionReactorDeuteriumConsumption(fusionLevel, fusionPercent)
        : 0;
    }

    const bonuses = useOfficerStore.getState().bonuses;
    const baseProductionWithOfficers = Math.round(baseHourlyProduction * bonuses.mineProductionMultiplier);
    const hourlyProduction =
      type === "deuterium" && fusionDeuteriumConsumption
        ? Math.max(0, baseProductionWithOfficers - fusionDeuteriumConsumption)
        : baseProductionWithOfficers;

    const capacity = calculateStorageCapacity(storageLevel);
    const bunkerCapacity = Math.floor(capacity * 0.1);
    const isFull = liveAmount >= capacity;

    return {
      current: Math.floor(liveAmount),
      capacity,
      isFull,
      hourlyProduction,
      bunkerCapacity,
      fusionDeuteriumConsumption,
    };
  },

  getEnergyMetrics: (planet) => {
    const bonuses = useOfficerStore.getState().bonuses;
    const settings = planet.resourceSettings;

    // 1. Solar Plant Energy
    const solarLevel =
      planet.buildings.find((b) => b.key === "solarPlant" || b.buildingType === 4)?.level ?? 0;
    const solarRatio = (settings?.solarPlantPercent ?? 100) / 100.0;
    const solarPlantEnergy = Math.floor(
      Math.floor(20 * solarLevel * Math.pow(1.1, solarLevel)) * solarRatio
    );

    // 2. Solar Satellite Energy
    const satCount =
      planet.units?.find((u) => u.unitType === 212)?.count ?? 0;
    const satUnitEnergy = calculateSolarSatelliteUnitEnergy(planet.tempMax);
    const satRatio = (settings?.solarSatellitePercent ?? 100) / 100.0;
    const solarSatelliteEnergy = Math.floor(
      Math.floor(satCount * satUnitEnergy) * satRatio
    );

    // 3. Fusion Reactor Energy & Deuterium
    const fusionLevel =
      planet.buildings.find((b) => b.key === "fusionReactor" || b.buildingType === 5)?.level ?? 0;
    const fusionPercent = settings?.fusionReactorPercent ?? 100;
    const energyTechLevel = useGameStore.getState().researches[113] ?? 0;

    const rawFusionEnergy = calculateFusionReactorEnergy(fusionLevel, energyTechLevel, fusionPercent);
    const rawFusionDeut = calculateFusionReactorDeuteriumConsumption(fusionLevel, fusionPercent);

    // Fuel availability rule (Task 05AQ Hata 3):
    // Deuterium stoğu sıfırlandığında santralin enerji üretimi durmalı; ancak Deuterium varken üretim eksiksiz şekilde toplam enerjiye eklenmelidir.
    const hasDeuteriumForFusion =
      fusionLevel > 0 && (planet.deuterium > 0 || planet.deuteriumPerHour > 0);
    const fusionReactorEnergy = hasDeuteriumForFusion ? rawFusionEnergy : 0;
    const fusionDeuteriumConsumption = hasDeuteriumForFusion ? rawFusionDeut : 0;

    // Gross Energy = E_solar_plant + E_solar_satellite + E_fusion_reactor
    const grossEnergy = solarPlantEnergy + solarSatelliteEnergy + fusionReactorEnergy;
    const effectiveProduced = Math.round(grossEnergy * bonuses.energyProductionMultiplier);
    const net = effectiveProduced - planet.consumedEnergy;

    return {
      current: net,
      produced: effectiveProduced,
      consumed: planet.consumedEnergy,
      solarPlantEnergy,
      fusionReactorEnergy,
      solarSatelliteEnergy,
      fusionDeuteriumConsumption,
      hasDeuteriumForFusion,
      fusionLevel,
    };
  },

  getPopulationMetrics: (planetId) => {
    const lf = get().getPlanetLifeformState(planetId);
    const current = lf.t1Population + lf.t2Population + lf.t3Population;
    const housing = lf.maxPopulation;
    // Food consumption is roughly 1 unit of food per 10 population per second
    const fed = Math.min(current, housing);
    const underfed = Math.max(0, current - fed);
    const shelterCapacity = lf.maxProtectedCapacity || 100;

    return {
      current,
      t2: lf.t2Population,
      t3: lf.t3Population,
      housing,
      fed,
      underfed,
      growthRate: "+0.03",
      shelterCapacity,
    };
  },

  getFoodMetrics: (planetId) => {
    const lf = get().getPlanetLifeformState(planetId);
    const current = lf.foodBalance;
    const capacity = lf.maxFoodCapacity;
    const foodPerHour = lf.foodPerSecond * 3600;
    const hourlyConsumption = Math.floor(
      (lf.t1Population + lf.t2Population * 1.5 + lf.t3Population * 2.0) * 10
    );
    const surplus = Math.max(0, foodPerHour - hourlyConsumption);

    let consumptionTimeRemaining = "~";
    if (surplus === 0 && hourlyConsumption > 0 && current > 0) {
      const hours = (current / hourlyConsumption).toFixed(1);
      consumptionTimeRemaining = `${hours} sa`;
    }

    return {
      current,
      capacity,
      surplus,
      consumption: hourlyConsumption,
      consumptionTimeRemaining,
    };
  },

  getDarkMatterMetrics: (currentDarkMatter) => {
    const purchased = get().purchasedDarkMatter;
    const found = Math.max(0, currentDarkMatter - purchased);
    return {
      total: currentDarkMatter,
      purchased,
      found,
    };
  },
}));
