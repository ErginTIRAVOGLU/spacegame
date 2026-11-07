import { create } from "zustand";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type FacilityItemKey =
  | "roboticsFactory"
  | "shipyard"
  | "researchLab"
  | "allianceDepot"
  | "missileSilo"
  | "naniteFactory"
  | "terraformer"
  | "spaceDock";

export type ResourceItemKey =
  | "metalMine"
  | "crystalMine"
  | "deuteriumSynthesizer"
  | "solarPlant"
  | "fusionReactor"
  | "solarSatellite"
  | "metalStorage"
  | "crystalStorage"
  | "deuteriumTank"
  | "crawler"
  | FacilityItemKey;

export interface BuildingPrerequisiteDef {
  label: string;
  requiredLevel: number;
  buildingKey?: ResourceItemKey;
  researchType?: number;
  href: string;
}

export interface BuildingPrerequisiteStatus {
  label: string;
  requiredLevel: number;
  currentLevel: number;
  met: boolean;
  type: "building" | "research";
  href: string;
}

export interface BuildingInfo {
  id: string;
  key: ResourceItemKey;
  buildingType: number;
  isUnit?: boolean;
  unitType?: number;
  category: "producer" | "storage" | "facility";
  name: string;
  description: string;
  level: number;
  baseMetal: number;
  baseCrystal: number;
  baseDeut: number;
  costFactor: number;
  prerequisites?: BuildingPrerequisiteDef[];
}

export interface ActiveBuildingQueue {
  buildingKey: ResourceItemKey;
  buildingName: string;
  targetLevel: number;
  startTimeUtc: string;
  endTimeUtc: string;
  isDemolition?: boolean;
}

export interface ActiveResearchQueue {
  id: string;
  originPlanetId: string;
  researchType: number;
  researchName: string;
  targetLevel: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface IncomingFleetShip {
  unitType: number;
  shipName: string;
  exactCount: number | null;
  displayCount: string;
}

export interface IncomingFleetAlert {
  id: string;
  originCoords: string;
  originPlanetName?: string;
  attackerName?: string;
  targetCoords: string;
  targetPlanetName?: string;
  missionType: string;
  missionTypeName?: string;
  arrivalUtc: string;
  shipCount: number;
  isHostile: boolean;
  attackerEspionageLevel?: number;
  defenderEspionageLevel?: number;
  intelTier?: 1 | 2 | 3;
  ships?: IncomingFleetShip[];
  isReturning?: boolean;
  canRecall?: boolean;
}

export interface PlanetStationedUnit {
  unitType: number;
  count: number;
}

export interface ShipyardQueueEntry {
  id: string;
  unitType: number;
  totalCount: number;
  completedCount: number;
  unitDurationSeconds: number;
  nextUnitFinishUtc: string;
}

export interface MerchantStatus {
  auction: {
    itemName: string;
    description: string;
    highestBid: number;
    highestBidder: string;
    endTimeUtc: string;
    remainingSeconds: number;
    recentAuctions: {
      itemName: string;
      winnerName: string;
      winningBid: number;
      wonAtUtc: string;
    }[];
  };
  scrapper: {
    scrapRatePercent: number;
    bargainCostDarkMatter: number;
  };
  importExport: {
    itemName: string;
    requiredValuation: number;
    alreadyPurchasedToday: boolean;
  };
}

export interface PlanetResourceSettings {
  metalMinePercent: number;
  crystalMinePercent: number;
  deuteriumSynthesizerPercent: number;
  solarPlantPercent: number;
  fusionReactorPercent: number;
  solarSatellitePercent: number;
  crawlerPercent: number;
}

export interface ActiveLifeformQueue {
  buildingKey: string;
  buildingName: string;
  targetLevel: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface GameToastNotification {
  id: string;
  type: "building" | "shipyard" | "defense" | "research" | "lifeform" | "fleet";
  title: string;
  message: string;
  planetName?: string;
  timestamp: number;
}

export interface GameSettings {
  browserPushEnabled: boolean;
  inGameToastsEnabled: boolean;
  soundEnabled: boolean;
  spyProbeCount: number; // 1 to 10
  isVacationMode: boolean;
  vacationUntilUtc: string | null;
  planetSorting: "order" | "coords" | "alphabetical" | "fields";
}

export interface PlanetSummary {
  id: string;
  name: string;
  coords: string;
  galaxy: number;
  system: number;
  slot: number;
  isMoon?: boolean;
  isCapital?: boolean;
  tempMin: number;
  tempMax: number;
  diameter: number;
  fieldsUsed: number;
  maxFields: number;
  metal: number;
  crystal: number;
  deuterium: number;
  metalPerHour: number;
  crystalPerHour: number;
  deuteriumPerHour: number;
  producedEnergy: number;
  consumedEnergy: number;
  serverTimeUtc: string;
  buildings: BuildingInfo[];
  activeBuildingQueue: ActiveBuildingQueue | null;
  units: PlanetStationedUnit[];
  shipyardQueue: ShipyardQueueEntry[];
  activeLifeformQueue?: ActiveLifeformQueue | null;
  resourceSettings?: PlanetResourceSettings;
}

export const DEFAULT_RESOURCE_SETTINGS: PlanetResourceSettings = {
  metalMinePercent: 100,
  crystalMinePercent: 100,
  deuteriumSynthesizerPercent: 100,
  solarPlantPercent: 100,
  fusionReactorPercent: 100,
  solarSatellitePercent: 100,
  crawlerPercent: 100,
};

export const BUILDING_CATALOG: Omit<BuildingInfo, "id" | "level">[] = [
  {
    key: "metalMine",
    buildingType: 1,
    category: "producer",
    name: "Metal Madeni",
    description:
      "Gemi ve bina insaatinda kullanilan, olmazsa olmaz hammaddelerin en önemli kaynagi.",
    baseMetal: 60,
    baseCrystal: 15,
    baseDeut: 0,
    costFactor: 1.5,
  },
  {
    key: "crystalMine",
    buildingType: 2,
    category: "producer",
    name: "Kristal Madeni",
    description:
      "Elektronik insaat malzemesi ve alasim için gereken hammaddelerin en önemli kaynagi.",
    baseMetal: 48,
    baseCrystal: 24,
    baseDeut: 0,
    costFactor: 1.6,
  },
  {
    key: "deuteriumSynthesizer",
    buildingType: 3,
    category: "producer",
    name: "Deuterium Sentezleyicisi",
    description:
      "Bir gezegende bulunan su kütlesinden sadece suyun içinde az miktarda bulunan Deuterium elementini çıkarır.",
    baseMetal: 225,
    baseCrystal: 75,
    baseDeut: 0,
    costFactor: 1.5,
  },
  {
    key: "solarPlant",
    buildingType: 4,
    category: "producer",
    name: "Solar Enerji Santrali",
    description:
      "Solar Enerji güneş ışınlarından elde edilir. Neredeyse tüm binaların, üretim icin enerjiye ihtiyaçları var.",
    baseMetal: 75,
    baseCrystal: 30,
    baseDeut: 0,
    costFactor: 1.5,
  },
  {
    key: "fusionReactor",
    buildingType: 5,
    category: "producer",
    name: "Füzyoenerji Santrali",
    description:
      "Füzyoenerji santrali, iki hidrojen atomunun helyum atomuna füzyonundan enerji kazanır.",
    baseMetal: 900,
    baseCrystal: 360,
    baseDeut: 180,
    costFactor: 1.8,
  },
  {
    key: "solarSatellite",
    buildingType: 212,
    isUnit: true,
    unitType: 212,
    category: "producer",
    name: "Solar Uydu",
    description:
      "Solar Uydular solar hücrelerden olusan yüksek yörüngede konuslandirilmis platformlardir. Günes isigini toplar ve de lazer araciligi ile yüzeydeki istasyona iletirler. Bu gezegen üzerinde bir solar uydu {SolarSatelliteEnergy} enerji üretiyor.",
    baseMetal: 0,
    baseCrystal: 2000,
    baseDeut: 500,
    costFactor: 1.0,
  },
  {
    key: "metalStorage",
    buildingType: 22,
    category: "storage",
    name: "Metal Deposu",
    description:
      "Daha islenmemis ama islenmeye hazir metallerin içinde tutulabilecegi depo.",
    baseMetal: 1000,
    baseCrystal: 0,
    baseDeut: 0,
    costFactor: 2.0,
  },
  {
    key: "crystalStorage",
    buildingType: 23,
    category: "storage",
    name: "Kristal Deposu",
    description:
      "Daha islenmemis ama islenmeye hazir kristallerin içinde tutulabilecegi depo.",
    baseMetal: 1000,
    baseCrystal: 500,
    baseDeut: 0,
    costFactor: 2.0,
  },
  {
    key: "deuteriumTank",
    buildingType: 24,
    category: "storage",
    name: "Deuterium Tankeri",
    description:
      "Yeni elde edilen deuteriumun depolanabileceği dev tankerler.",
    baseMetal: 1000,
    baseCrystal: 1000,
    baseDeut: 0,
    costFactor: 2.0,
  },
  {
    key: "crawler",
    buildingType: 217,
    isUnit: true,
    unitType: 217,
    category: "producer",
    name: "Paletli (Crawler)",
    description:
      "Canlı türü/madencilik destek ünitesi; maden üretimini artıran mekanik paletli filo/yer ünitesi.",
    baseMetal: 2000,
    baseCrystal: 2000,
    baseDeut: 1000,
    costFactor: 1.0,
  },
  {
    key: "roboticsFactory",
    buildingType: 14,
    category: "facility",
    name: "Robot Fabrikası",
    description:
      "Robot fabrikalari gezegenin altyapisi ve organizasyonu için gereken vasifsiz is gücünü üretiyorlar. Kademesi arttikça diger binalarin yapim süreci de daha hizli isliyor.",
    baseMetal: 400,
    baseCrystal: 120,
    baseDeut: 200,
    costFactor: 2.0,
    prerequisites: [],
  },
  {
    key: "shipyard",
    buildingType: 21,
    category: "facility",
    name: "Uzay Tersanesi",
    description:
      "Gezegen tersanesinde her çesit gemi ve savunma sanayi binalari insa edilir.",
    baseMetal: 400,
    baseCrystal: 200,
    baseDeut: 100,
    costFactor: 2.0,
    prerequisites: [
      {
        label: "Robot Fabrikası",
        requiredLevel: 2,
        buildingKey: "roboticsFactory",
        href: "/facilities",
      },
    ],
  },
  {
    key: "researchLab",
    buildingType: 31,
    category: "facility",
    name: "Bilimsel Araştırma Laboratuvarı",
    description:
      "Yeni teknolojileri kesfedebilmek için bilimsel arastirma istasyonu gerekli.",
    baseMetal: 200,
    baseCrystal: 400,
    baseDeut: 200,
    costFactor: 2.0,
    prerequisites: [],
  },
  {
    key: "allianceDepot",
    buildingType: 34,
    category: "facility",
    name: "İttifak Deposu",
    description:
      "İttifak Deposu, savunmaya yardım eden ve yörüngede bulunan dost ittifak filolarına yakıt aktarılmasını sağlar. İttifak Deposu ayrıca grup üyelerinin azami sayısını artırır.",
    baseMetal: 20000,
    baseCrystal: 40000,
    baseDeut: 0,
    costFactor: 2.0,
    prerequisites: [],
  },
  {
    key: "missileSilo",
    buildingType: 44,
    category: "facility",
    name: "Roket Silosu",
    description: "Roket silolarinda roketler konuslandirilir.",
    baseMetal: 20000,
    baseCrystal: 20000,
    baseDeut: 1000,
    costFactor: 2.0,
    prerequisites: [
      {
        label: "Uzay Tersanesi",
        requiredLevel: 1,
        buildingKey: "shipyard",
        href: "/facilities",
      },
    ],
  },
  {
    key: "naniteFactory",
    buildingType: 15,
    category: "facility",
    name: "Nanit Fabrikası",
    description:
      "Robot tekniginin taçlandirilmasi, çok önemli bir rolü var. Her kademe gemi, bina ve de savunma bina ve yapilari yapimi için gereken süreyi yari yariya azaltiyor.",
    baseMetal: 1000000,
    baseCrystal: 500000,
    baseDeut: 100000,
    costFactor: 2.0,
    prerequisites: [
      {
        label: "Robot Fabrikası",
        requiredLevel: 10,
        buildingKey: "roboticsFactory",
        href: "/facilities",
      },
      {
        label: "Bilgisayar Tekniği",
        requiredLevel: 10,
        researchType: 108,
        href: "/research",
      },
    ],
  },
  {
    key: "terraformer",
    buildingType: 33,
    category: "facility",
    name: "Terraformer",
    description:
      "Gezegenin gereksiz alanlarini altyapi binalarinin yapimi icin kullanisli hale getirmeye yarar.",
    baseMetal: 0,
    baseCrystal: 50000,
    baseDeut: 100000,
    costFactor: 2.0,
    prerequisites: [
      {
        label: "Nanit Fabrikası",
        requiredLevel: 1,
        buildingKey: "naniteFactory",
        href: "/facilities",
      },
      {
        label: "Enerji Tekniği",
        requiredLevel: 12,
        researchType: 113,
        href: "/research",
      },
    ],
  },
  {
    key: "spaceDock",
    buildingType: 36,
    category: "facility",
    name: "Uzay İskelesi",
    description: "Uzay İskelesi`nde enkaz alanları tamir edilebilir.",
    baseMetal: 200,
    baseCrystal: 0,
    baseDeut: 50,
    costFactor: 5.0,
    prerequisites: [
      {
        label: "Uzay Tersanesi",
        requiredLevel: 2,
        buildingKey: "shipyard",
        href: "/facilities",
      },
    ],
  },
];

function mapBuildingTypeToKey(buildingType: number): ResourceItemKey | null {
  const found = BUILDING_CATALOG.find((b) => b.buildingType === buildingType);
  return found ? found.key : null;
}

function mapBuildingTypeToName(buildingType: number): string {
  const found = BUILDING_CATALOG.find((b) => b.buildingType === buildingType);
  return found ? found.name : `Bina #${buildingType}`;
}

export function calculateStorageCapacity(level: number): number {
  const lvl = Math.max(0, level);
  return 5000 * Math.floor(2.5 * Math.exp((20 * lvl) / 33));
}

export function calculateSolarSatelliteUnitEnergy(tempMax: number): number {
  return Math.max(1, Math.floor((tempMax + 140) / 6));
}

/**
 * Canonical OGame Fusion Reactor Energy Formula:
 * floor(30 * Level * (1 + 0.01 * EnergyTechLevel)^Level) * (Percent / 100)
 */
export function calculateFusionReactorEnergy(
  level: number,
  energyTechLevel: number = 0,
  percent: number = 100
): number {
  if (level <= 0 || percent <= 0) return 0;
  const ratio = Math.max(0, Math.min(100, percent)) / 100.0;
  const base = Math.floor(30 * level * Math.pow(1.0 + 0.01 * energyTechLevel, level));
  return Math.floor(base * ratio);
}

/**
 * Canonical OGame Fusion Reactor Hourly Deuterium Consumption:
 * floor(10 * Level * 1.1^Level) * (Percent / 100)
 */
export function calculateFusionReactorDeuteriumConsumption(
  level: number,
  percent: number = 100
): number {
  if (level <= 0 || percent <= 0) return 0;
  const ratio = Math.max(0, Math.min(100, percent)) / 100.0;
  const base = Math.floor(10 * level * Math.pow(1.1, level));
  return Math.floor(base * ratio);
}

export function calculateBuildingEnergyDelta(
  b: BuildingInfo,
  tempMax: number,
  energyTechLevel: number = 0
): { label: string; value: number; isProduction: boolean } {
  const cur = Math.max(0, b.level);
  const next = cur + 1;

  switch (b.key) {
    case "metalMine":
    case "crystalMine": {
      const curE = Math.ceil(10 * cur * Math.pow(1.1, cur));
      const nextE = Math.ceil(10 * next * Math.pow(1.1, next));
      return {
        label: "Enerji ihtiyacı",
        value: Math.max(1, nextE - curE),
        isProduction: false,
      };
    }
    case "deuteriumSynthesizer": {
      const curE = Math.ceil(20 * cur * Math.pow(1.1, cur));
      const nextE = Math.ceil(20 * next * Math.pow(1.1, next));
      return {
        label: "Enerji ihtiyacı",
        value: Math.max(1, nextE - curE),
        isProduction: false,
      };
    }
    case "solarPlant": {
      const curP = Math.floor(20 * cur * Math.pow(1.1, cur));
      const nextP = Math.floor(20 * next * Math.pow(1.1, next));
      return {
        label: "Enerji üretimi",
        value: `+${Math.max(1, nextP - curP)}` as unknown as number,
        isProduction: true,
      };
    }
    case "fusionReactor": {
      const curP = calculateFusionReactorEnergy(cur, energyTechLevel, 100);
      const nextP = calculateFusionReactorEnergy(next, energyTechLevel, 100);
      return {
        label: "Enerji üretimi",
        value: Math.max(1, nextP - curP),
        isProduction: true,
      };
    }
    case "solarSatellite": {
      const satEnergy = calculateSolarSatelliteUnitEnergy(tempMax);
      return {
        label: "Enerji üretimi (birim)",
        value: satEnergy,
        isProduction: true,
      };
    }
    case "crawler":
      return {
        label: "Birim enerji tüketimi",
        value: 50,
        isProduction: false,
      };
    default:
      return {
        label: "Enerji ihtiyacı",
        value: 0,
        isProduction: false,
      };
  }
}

export function evaluateBuildingPrerequisites(
  b: BuildingInfo,
  planet: PlanetSummary,
  researches: Record<number, number>
): BuildingPrerequisiteStatus[] {
  if (!b.prerequisites || b.prerequisites.length === 0) {
    return [];
  }

  return b.prerequisites.map((req) => {
    if (req.buildingKey) {
      const currentLevel =
        planet.buildings.find((item) => item.key === req.buildingKey)?.level ??
        0;
      return {
        label: req.label,
        requiredLevel: req.requiredLevel,
        currentLevel,
        met: currentLevel >= req.requiredLevel,
        type: "building",
        href: req.href,
      };
    }

    const currentLevel = req.researchType
      ? researches[req.researchType] ?? 0
      : 0;
    return {
      label: req.label,
      requiredLevel: req.requiredLevel,
      currentLevel,
      met: currentLevel >= req.requiredLevel,
      type: "research",
      href: req.href,
    };
  });
}

export function calculateUpgradeCost(
  b: BuildingInfo,
  roboticsLevel = 4,
  naniteLevel = 0
) {
  const targetLevel = b.level + 1;
  const multiplier = b.isUnit ? 1 : Math.pow(b.costFactor, targetLevel - 1);
  const metal = Math.floor(b.baseMetal * multiplier);
  const crystal = Math.floor(b.baseCrystal * multiplier);
  const deuterium = Math.floor(b.baseDeut * multiplier);
  const durationSeconds = Math.max(
    1,
    Math.floor(
      ((metal + crystal) /
        (2500 *
          (1 + Math.max(0, roboticsLevel)) *
          Math.pow(2, Math.max(0, naniteLevel)))) *
        3600
    )
  );
  return { targetLevel, metal, crystal, deuterium, durationSeconds };
}

export function calculateDemolitionCost(
  b: BuildingInfo,
  ionTechLevel = 0,
  roboticsLevel = 4,
  naniteLevel = 0
) {
  if (b.level <= 0) {
    return {
      targetLevel: 0,
      metal: 0,
      crystal: 0,
      deuterium: 0,
      durationSeconds: 0,
      discountPercent: 0,
    };
  }
  const targetLevel = b.level - 1;
  const multiplier = Math.pow(b.costFactor, b.level - 1);
  const discount = Math.min(1.0, Math.max(0, ionTechLevel * 0.04));
  const factor = 1.0 - discount;

  const metal = Math.floor(b.baseMetal * multiplier * factor);
  const crystal = Math.floor(b.baseCrystal * multiplier * factor);
  const deuterium = Math.floor(b.baseDeut * multiplier * factor);
  const durationSeconds = Math.max(
    1,
    Math.floor(
      ((metal + crystal) /
        (2500 *
          (1 + Math.max(0, roboticsLevel)) *
          Math.pow(2, Math.max(0, naniteLevel)))) *
        3600
    )
  );

  return {
    targetLevel,
    metal,
    crystal,
    deuterium,
    durationSeconds,
    discountPercent: Math.round(discount * 100),
  };
}

const fallbackServerTimeUtc = "2026-10-28T00:00:00.000Z";

const initialPlanets: PlanetSummary[] = [
  {
    id: "planet-homeworld-01",
    name: "Aethelgard Prime",
    coords: "[1:142:8]",
    galaxy: 1,
    system: 142,
    slot: 8,
    isCapital: true,
    tempMin: 24,
    tempMax: 64,
    diameter: 12800,
    fieldsUsed: 58,
    maxFields: 163,
    metal: 48250,
    crystal: 29400,
    deuterium: 12850,
    metalPerHour: 2457,
    crystalPerHour: 1426,
    deuteriumPerHour: 432,
    producedEnergy: 1859,
    consumedEnergy: 1290,
    serverTimeUtc: fallbackServerTimeUtc,
    buildings: BUILDING_CATALOG.map((meta) => ({
      ...meta,
      id: `init-${meta.key}`,
      level:
        meta.key === "metalMine"
          ? 14
          : meta.key === "crystalMine"
          ? 12
          : meta.key === "deuteriumSynthesizer"
          ? 9
          : meta.key === "solarPlant"
          ? 15
          : meta.key === "fusionReactor"
          ? 2
          : meta.key === "metalStorage"
          ? 4
          : meta.key === "crystalStorage"
          ? 3
          : meta.key === "deuteriumTank"
          ? 3
          : meta.key === "roboticsFactory"
          ? 4
          : meta.key === "shipyard"
          ? 4
          : meta.key === "researchLab"
          ? 3
          : 0,
    })),
    activeBuildingQueue: null,
    units: [
      { unitType: 202, count: 45 },
      { unitType: 203, count: 18 },
      { unitType: 204, count: 120 },
      { unitType: 205, count: 35 },
      { unitType: 206, count: 25 },
      { unitType: 207, count: 12 },
      { unitType: 209, count: 10 },
      { unitType: 210, count: 30 },
    ],
    shipyardQueue: [],
    resourceSettings: { ...DEFAULT_RESOURCE_SETTINGS },
  },
];

interface GameState {
  userId: string | null;
  username: string;
  darkMatter: number;
  playerClass: "None" | "Collector" | "General" | "Discoverer";
  totalPoints: number;
  honorPoints: number;
  isLoaded: boolean;
  planets: PlanetSummary[];
  selectedPlanetId: string;
  researches: Record<number, number>;
  activeResearchQueue: ActiveResearchQueue | null;
  incomingFleets: IncomingFleetAlert[];
  toasts: GameToastNotification[];
  addToast: (toast: Omit<GameToastNotification, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isNotesOpen: boolean;
  setIsNotesOpen: (open: boolean) => void;
  isBuddiesOpen: boolean;
  setIsBuddiesOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  setPlayerClass: (playerClass: "None" | "Collector" | "General" | "Discoverer") => void;
  lastError: string | null;
  selectPlanet: (planetId: string) => void;
  fetchBootstrap: () => Promise<void>;
  renamePlanet: (planetId: string, newName: string) => Promise<void>;
  startBuildingUpgrade: (buildingKey: ResourceItemKey) => Promise<void>;
  startBuildingDemolish: (
    buildingKey: ResourceItemKey
  ) => Promise<{ success: boolean; message?: string }>;
  cancelBuildingUpgrade: (planetId?: string) => Promise<void>;
  speedupBuildingUpgrade: (planetId?: string) => Promise<void>;
  instantCompleteBuildingUpgrade: (
    targetPlanetId?: string,
    queueItemId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  halveBuildingDuration: (
    targetPlanetId?: string,
    queueItemId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  instantCompleteResearch: () => Promise<{ success: boolean; message?: string }>;
  halveResearchDuration: () => Promise<{ success: boolean; message?: string }>;
  instantCompleteShipyardBatch: (
    targetPlanetId?: string,
    queueItemId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  halveShipyardDuration: (
    targetPlanetId?: string,
    queueItemId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  cancelLifeformBuilding: (planetId?: string) => Promise<void>;
  instantCompleteLifeformBuilding: (
    planetId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  halveLifeformBuildingDuration: (
    planetId?: string
  ) => Promise<{ success: boolean; message?: string }>;
  completeActiveBuildingUpgrade: () => Promise<void>;
  enqueueShipyardBatch: (unitType: number, count: number) => Promise<boolean>;
  fetchPlanetResourceSettings: (
    planetId: string
  ) => Promise<PlanetResourceSettings>;
  updatePlanetResourceSettings: (
    planetId: string,
    settings: PlanetResourceSettings
  ) => Promise<PlanetResourceSettings>;
  addFleetAlert: (alert: IncomingFleetAlert) => void;
  fetchMerchantStatus: (planetId?: string) => Promise<MerchantStatus | null>;
  executeMerchantTrade: (
    targetResource: string,
    spentMetal: number,
    spentCrystal: number,
    spentDeuterium: number
  ) => Promise<{ success: boolean; message: string }>;
  buyResourcePack: (
    packType: string
  ) => Promise<{ success: boolean; message: string }>;
  submitAuctionBid: (
    metal: number,
    crystal: number,
    deuterium: number,
    honorPoints?: number
  ) => Promise<{ success: boolean; message: string }>;
  scrapperBargain: () => Promise<{ success: boolean; message: string; newRate?: number }>;
  scrapperRecycle: (
    units: Record<number, number>
  ) => Promise<{ success: boolean; message: string }>;
  buyImportExportContainer: (
    metal: number,
    crystal: number,
    deuterium: number
  ) => Promise<{ success: boolean; message: string; wonReward?: string }>;
  startResearch: (
    researchType: number
  ) => Promise<{ success: boolean; message: string }>;
  cancelResearch: () => Promise<void>;
  speedupResearch: () => Promise<void>;
  completeActiveResearch: () => Promise<void>;
  dispatchFleet: (command: {
    originPlanetId: string;
    targetGalaxy: number;
    targetSystem: number;
    targetSlot: number;
    targetType: number;
    missionType: number;
    ships: Record<number, number>;
    speedFactor?: number;
    metalCargo?: number;
    crystalCargo?: number;
    deuteriumCargo?: number;
    holdHours?: number;
  }) => Promise<{ success: boolean; message: string }>;
  recallFleet: (
    missionId: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const useGameStore = create<GameState>((set, get) => ({
  userId: null,
  username: "Consul Pegasus",
  darkMatter: 2500,
  playerClass: "None",
  totalPoints: 12500,
  honorPoints: 0,
  isLoaded: false,
  planets: initialPlanets,
  selectedPlanetId: initialPlanets[0].id,
  researches: {
    108: 4, // Bilgisayar Tekniği
    113: 6, // Enerji Tekniği
  },
  activeResearchQueue: null,
  incomingFleets: [],
  toasts: [],
  lastError: null,

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: GameToastNotification = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isNotesOpen: false,
  setIsNotesOpen: (open) => set({ isNotesOpen: open }),
  isBuddiesOpen: false,
  setIsBuddiesOpen: (open) => set({ isBuddiesOpen: open }),
  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  settings: {
    browserPushEnabled: false,
    inGameToastsEnabled: true,
    soundEnabled: true,
    spyProbeCount: 1,
    isVacationMode: false,
    vacationUntilUtc: null,
    planetSorting: "order",
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ogame_user_settings", JSON.stringify(next));
      } catch {
        // Ignore localStorage error
      }
    }
  },

  setPlayerClass: (playerClass) => set({ playerClass }),

  selectPlanet: (planetId) => set({ selectedPlanetId: planetId }),

  fetchBootstrap: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/player/bootstrap`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();

      // Hydrate local settings on initial bootstrap if available in browser
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("ogame_user_settings");
          if (saved) {
            set((state) => ({
              settings: { ...state.settings, ...JSON.parse(saved) },
            }));
          }
        } catch {
          // Ignore
        }
      }

      const existingPlanets = get().planets;

      const mappedPlanets: PlanetSummary[] = (data.planets ?? []).map(
        (
          p: {
            id: string;
            name: string;
            coords: string;
            galaxy: number;
            system: number;
            slot: number;
            isCapital?: boolean;
            tempMin: number;
            tempMax: number;
            diameter: number;
            fieldsUsed: number;
            maxFields: number;
            metal: number;
            crystal: number;
            deuterium: number;
            metalPerHour: number;
            crystalPerHour: number;
            deuteriumPerHour: number;
            producedEnergy: number;
            consumedEnergy: number;
            serverTimeUtc: string;
            buildings?: { id: string; buildingType: number; level: number }[];
            activeBuildingQueue?: {
              id: string;
              buildingType: number;
              targetLevel: number;
              startTimeUtc: string;
              endTimeUtc: string;
            } | null;
            units?: { unitType: number; count: number }[];
            shipyardQueue?: ShipyardQueueEntry[];
            activeLifeformQueue?: ActiveLifeformQueue | null;
          },
          index: number
        ) => {
          const dbBuildings = p.buildings ?? [];
          const dbUnits = p.units ?? [];
          const prevPlanet = existingPlanets.find((ep) => ep.id === p.id);

          const buildings: BuildingInfo[] = BUILDING_CATALOG.map((meta) => {
            if (meta.isUnit && meta.unitType) {
              const unitMatch = dbUnits.find(
                (u) => u.unitType === meta.unitType
              );
              return {
                ...meta,
                id: `${p.id}-${meta.key}`,
                level: unitMatch?.count ?? 0,
              };
            }

            const match = dbBuildings.find(
              (b) => b.buildingType === meta.buildingType
            );
            return {
              ...meta,
              id: match?.id ?? `${p.id}-${meta.key}`,
              level: match?.level ?? 0,
            };
          });

          let activeBuildingQueue: ActiveBuildingQueue | null = null;
          if (p.activeBuildingQueue) {
            const bKey =
              mapBuildingTypeToKey(p.activeBuildingQueue.buildingType) ??
              "metalMine";
            const matchBuilding = buildings.find((b) => b.key === bKey);
            const currentLevel = matchBuilding?.level ?? 0;
            const isDemolition = p.activeBuildingQueue.targetLevel < currentLevel;

            activeBuildingQueue = {
              buildingKey: bKey,
              buildingName: mapBuildingTypeToName(
                p.activeBuildingQueue.buildingType
              ),
              targetLevel: p.activeBuildingQueue.targetLevel,
              startTimeUtc: p.activeBuildingQueue.startTimeUtc,
              endTimeUtc: p.activeBuildingQueue.endTimeUtc,
              isDemolition,
            };
          }

          return {
            id: p.id,
            name: p.name,
            coords: p.coords,
            galaxy: p.galaxy,
            system: p.system,
            slot: p.slot,
            isCapital: p.isCapital ?? index === 0,
            tempMin: p.tempMin,
            tempMax: p.tempMax,
            diameter: p.diameter,
            fieldsUsed: p.fieldsUsed,
            maxFields: p.maxFields,
            metal: p.metal,
            crystal: p.crystal,
            deuterium: p.deuterium,
            metalPerHour: p.metalPerHour,
            crystalPerHour: p.crystalPerHour,
            deuteriumPerHour: p.deuteriumPerHour,
            producedEnergy: p.producedEnergy,
            consumedEnergy: p.consumedEnergy,
            serverTimeUtc: p.serverTimeUtc,
            buildings,
            activeBuildingQueue,
            activeLifeformQueue: p.activeLifeformQueue ?? null,
            units: dbUnits,
            shipyardQueue: p.shipyardQueue ?? [],
            resourceSettings:
              prevPlanet?.resourceSettings ?? { ...DEFAULT_RESOURCE_SETTINGS },
          };
        }
      );

      if (mappedPlanets.length === 0) return;

      const currentSelected = get().selectedPlanetId;
      const validSelected = mappedPlanets.some((p) => p.id === currentSelected)
        ? currentSelected
        : mappedPlanets[0].id;

      const mappedResearches: Record<number, number> = {
        ...get().researches,
      };
      if (Array.isArray(data.researches)) {
        for (const r of data.researches) {
          if (typeof r.researchType === "number" && typeof r.level === "number") {
            mappedResearches[r.researchType] = r.level;
          }
        }
      }

      set({
        userId: data.user?.id ?? null,
        username: data.user?.username ?? "Consul Pegasus",
        darkMatter: data.user?.darkMatter ?? 2500,
        playerClass: data.user?.playerClass ?? "None",
        totalPoints: data.user?.totalPoints ?? 12500,
        honorPoints: data.user?.honorPoints ?? 0,
        isLoaded: true,
        planets: mappedPlanets,
        selectedPlanetId: validSelected,
        researches: mappedResearches,
        activeResearchQueue: data.activeResearchQueue ?? null,
        incomingFleets: data.incomingFleets ?? [],
        lastError: null,
      });
    } catch {
      // Backend unreachable; keep current state
    }
  },

  renamePlanet: async (planetId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    set((state) => ({
      planets: state.planets.map((p) =>
        p.id === planetId ? { ...p, name: trimmed } : p
      ),
    }));

    try {
      await fetch(`${API_BASE_URL}/api/planets/${planetId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: trimmed }),
      });
      await get().fetchBootstrap();
    } catch {
      // Optimistic state already updated
    }
  },

  startBuildingUpgrade: async (buildingKey) => {
    const state = get();
    const planet = state.planets.find((p) => p.id === state.selectedPlanetId);
    if (!planet) return;

    const b = planet.buildings.find((item) => item.key === buildingKey);
    if (!b) return;

    // If Solar Satellite or Crawler unit, enqueue 1 unit in Shipyard
    if (b.isUnit && b.unitType) {
      await get().enqueueShipyardBatch(b.unitType, 1);
      return;
    }

    if (planet.activeBuildingQueue) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planet.id}/buildings/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buildingType: b.buildingType }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        set({ lastError: err?.message ?? "Failed to start upgrade." });
        return;
      }

      await get().fetchBootstrap();
    } catch {
      set({ lastError: "Network error communicating with backend API." });
    }
  },

  startBuildingDemolish: async (buildingKey) => {
    const state = get();
    const planet = state.planets.find((p) => p.id === state.selectedPlanetId);
    if (!planet) return { success: false, message: "Gezegen bulunamadı." };

    const b = planet.buildings.find((item) => item.key === buildingKey);
    if (!b || b.level <= 0) {
      return { success: false, message: "Kademe 0 olan bina yıkılamaz." };
    }

    if (planet.activeBuildingQueue) {
      return { success: false, message: "İnşaat sırası meşgul." };
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planet.id}/buildings/demolish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buildingType: b.buildingType }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.message ?? "Yıkım görevi başlatılamadı.";
        set({ lastError: msg });
        return { success: false, message: msg };
      }

      await get().fetchBootstrap();
      return { success: true };
    } catch {
      const msg = "Sunucu ile iletişim kurulurken ağ hatası oluştu.";
      set({ lastError: msg });
      return { success: false, message: msg };
    }
  },

  cancelBuildingUpgrade: async (targetPlanetId) => {
    const state = get();
    const planetId = targetPlanetId ?? state.selectedPlanetId;
    try {
      await fetch(`${API_BASE_URL}/api/planets/${planetId}/buildings/queue`, {
        method: "DELETE",
      });
      await get().fetchBootstrap();
    } catch {
      set((s) => ({
        planets: s.planets.map((p) =>
          p.id === planetId ? { ...p, activeBuildingQueue: null } : p
        ),
      }));
    }
  },

  speedupBuildingUpgrade: async (targetPlanetId) => {
    await get().halveBuildingDuration(targetPlanetId);
  },

  instantCompleteBuildingUpgrade: async (targetPlanetId, queueItemId) => {
    const state = get();
    const planetId = targetPlanetId ?? state.selectedPlanetId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/buildings/instant-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueItemId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Anında tamamlama başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  halveBuildingDuration: async (targetPlanetId, queueItemId) => {
    const state = get();
    const planetId = targetPlanetId ?? state.selectedPlanetId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/buildings/halve-duration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueItemId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Süreyi yarıla işlemi başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  instantCompleteResearch: async () => {
    const state = get();
    const userId = state.userId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/research/instant-complete?userId=${userId}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Araştırmayı tamamlama başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  halveResearchDuration: async () => {
    const state = get();
    const userId = state.userId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/research/halve-duration?userId=${userId}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Araştırma süresini yarıla işlemi başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  instantCompleteShipyardBatch: async (targetPlanetId, queueItemId) => {
    const state = get();
    const planetId = targetPlanetId ?? state.selectedPlanetId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/shipyard/instant-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueItemId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Tersane üretimini tamamlama başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  halveShipyardDuration: async (targetPlanetId, queueItemId) => {
    const state = get();
    const planetId = targetPlanetId ?? state.selectedPlanetId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/shipyard/halve-duration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueItemId }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof data?.remainingDarkMatter === "number") {
          set({ darkMatter: data.remainingDarkMatter });
        }
        await get().fetchBootstrap();
        return { success: true };
      }
      return {
        success: false,
        message: data?.message ?? "Tersane süresini yarıla işlemi başarısız oldu.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bağlantı hatası.";
      return { success: false, message: msg };
    }
  },

  cancelLifeformBuilding: async (planetId) => {
    const targetPlanetId = planetId ?? get().selectedPlanetId;
    if (!targetPlanetId) return;

    try {
      await fetch(
        `${API_BASE_URL}/api/planets/${targetPlanetId}/lifeforms/buildings/cancel`,
        { method: "POST" }
      );
      await get().fetchBootstrap();
    } catch {
      // Ignore
    }
  },

  instantCompleteLifeformBuilding: async (planetId) => {
    const targetPlanetId = planetId ?? get().selectedPlanetId;
    if (!targetPlanetId) return { success: false, message: "Gezegen bulunamadı." };

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${targetPlanetId}/lifeforms/buildings/instant-complete`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: data?.message ?? "Canlı türü binası tamamlanamadı.",
        };
      }
      await get().fetchBootstrap();
      return {
        success: true,
        message: data?.message ?? "Canlı türü binası başarıyla tamamlandı!",
      };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  halveLifeformBuildingDuration: async (planetId) => {
    const targetPlanetId = planetId ?? get().selectedPlanetId;
    if (!targetPlanetId) return { success: false, message: "Gezegen bulunamadı." };

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${targetPlanetId}/lifeforms/buildings/halve-duration`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: data?.message ?? "Süre yarıya indirilemedi.",
        };
      }
      await get().fetchBootstrap();
      return {
        success: true,
        message: data?.message ?? "Süre başarıyla yarıya indirildi!",
      };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  completeActiveBuildingUpgrade: async () => {
    await get().fetchBootstrap();
  },

  enqueueShipyardBatch: async (unitType, count) => {
    const state = get();
    const planet = state.planets.find((p) => p.id === state.selectedPlanetId);
    if (!planet || count <= 0) return false;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planet.id}/shipyard/enqueue`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unitType, count }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        set({ lastError: err?.message ?? "Failed to enqueue shipyard order." });
        return false;
      }

      await get().fetchBootstrap();
      return true;
    } catch {
      set({ lastError: "Network error communicating with backend API." });
      return false;
    }
  },

  fetchPlanetResourceSettings: async (planetId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/resource-settings`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as PlanetResourceSettings;
        set((state) => ({
          planets: state.planets.map((p) =>
            p.id === planetId ? { ...p, resourceSettings: data } : p
          ),
        }));
        return data;
      }
    } catch {
      // Fallback to local
    }
    const current = get().planets.find((p) => p.id === planetId);
    return current?.resourceSettings ?? { ...DEFAULT_RESOURCE_SETTINGS };
  },

  updatePlanetResourceSettings: async (planetId, settings) => {
    set((state) => ({
      planets: state.planets.map((p) =>
        p.id === planetId ? { ...p, resourceSettings: settings } : p
      ),
    }));

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planetId}/resource-settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetResourceSettings;
        set((state) => ({
          planets: state.planets.map((p) =>
            p.id === planetId ? { ...p, resourceSettings: updated } : p
          ),
        }));
        return updated;
      }
    } catch {
      // Optimistic state already updated
    }
    return settings;
  },

  addFleetAlert: (alert) =>
    set((state) => ({
      incomingFleets: [
        alert,
        ...state.incomingFleets.filter((f) => f.id !== alert.id),
      ],
    })),

  fetchMerchantStatus: async (planetId) => {
    const currentPlanetId = planetId ?? get().selectedPlanetId;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/merchant/status?planetId=${currentPlanetId}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        return (await res.json()) as MerchantStatus;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  executeMerchantTrade: async (targetResource, spentMetal, spentCrystal, spentDeuterium) => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId,
          targetResource,
          spentMetal,
          spentCrystal,
          spentDeuterium,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Takas başarısız." };
      }
      await get().fetchBootstrap();
      return { success: true, message: data.message ?? "Takas başarılı." };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  buyResourcePack: async (packType) => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/buy-resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planetId, packType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Satın alma başarısız." };
      }
      await get().fetchBootstrap();
      return { success: true, message: data.message ?? "Satın alma başarılı." };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  submitAuctionBid: async (metal, crystal, deuterium, honorPoints = 0) => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/auction/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId,
          metalBid: metal,
          crystalBid: crystal,
          deuteriumBid: deuterium,
          honorPointsBid: honorPoints,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Teklif verilemedi." };
      }
      await get().fetchBootstrap();
      return { success: true, message: data.message ?? "Teklif kaydedildi." };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  scrapperBargain: async () => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/scrapper/bargain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Pazarlık başarısız." };
      }
      await get().fetchBootstrap();
      return {
        success: true,
        message: data.message ?? "Pazarlık başarılı.",
        newRate: data.newRate,
      };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  scrapperRecycle: async (units) => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/scrapper/recycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planetId, units }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Hurdaya dönüştürme başarısız." };
      }
      await get().fetchBootstrap();
      return { success: true, message: data.message ?? "Dönüştürme başarılı." };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  buyImportExportContainer: async (paidMetal, paidCrystal, paidDeuterium) => {
    const planetId = get().selectedPlanetId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/merchant/import-export/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId,
          paidMetal,
          paidCrystal,
          paidDeuterium,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Konteyner satın alınamadı." };
      }
      await get().fetchBootstrap();
      return {
        success: true,
        message: data.message ?? "Konteyner açıldı.",
        wonReward: data.wonReward,
      };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  startResearch: async (researchType) => {
    const state = get();
    const planetId = state.selectedPlanetId;
    const userId = state.userId;
    if (!userId) {
      return { success: false, message: "Kullanıcı oturumu bulunamadı." };
    }

    if (state.activeResearchQueue) {
      return {
        success: false,
        message: "Hesapta zaten devam eden aktif bir araştırma bulunuyor (Hesap geneli tek kuyruk).",
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/research/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          originPlanetId: planetId,
          researchType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message ?? "Araştırma başlatılamadı." };
      }

      await get().fetchBootstrap();
      return { success: true, message: "Araştırma başarıyla başlatıldı." };
    } catch {
      return { success: false, message: "Ağ bağlantı hatası." };
    }
  },

  cancelResearch: async () => {
    const state = get();
    const userId = state.userId;
    if (!userId) return;

    try {
      await fetch(`${API_BASE_URL}/api/research/queue?userId=${userId}`, {
        method: "DELETE",
      });
      await get().fetchBootstrap();
    } catch {
      set({ activeResearchQueue: null });
    }
  },

  speedupResearch: async () => {
    const state = get();
    const userId = state.userId;
    if (!userId) return;

    try {
      await fetch(`${API_BASE_URL}/api/research/speedup?userId=${userId}`, {
        method: "POST",
      });
      await get().fetchBootstrap();
    } catch {
      // Ignore
    }
  },

  completeActiveResearch: async () => {
    await get().fetchBootstrap();
  },

  dispatchFleet: async (command) => {
    const state = get();
    if (!state.userId) {
      await get().fetchBootstrap();
    }
    const currentUserId = get().userId;
    if (!currentUserId) {
      return { success: false, message: "Kullanıcı oturumu doğrulanamadı." };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/fleets/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          originPlanetId: command.originPlanetId,
          targetGalaxy: command.targetGalaxy,
          targetSystem: command.targetSystem,
          targetSlot: command.targetSlot,
          targetType: command.targetType,
          missionType: command.missionType,
          ships: command.ships,
          speedFactor: command.speedFactor ?? 1.0,
          metalCargo: command.metalCargo ?? 0,
          crystalCargo: command.crystalCargo ?? 0,
          deuteriumCargo: command.deuteriumCargo ?? 0,
          holdHours: command.holdHours ?? 0,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: data?.message ?? "Filo sevkiyatı sunucu tarafından reddedildi.",
        };
      }

      await get().fetchBootstrap();
      return { success: true, message: "Filo başarıyla sevk edildi." };
    } catch {
      return { success: false, message: "Sunucu ile iletişim kurulurken ağ hatası oluştu." };
    }
  },

  recallFleet: async (missionId: string) => {
    const state = get();
    if (!state.userId) {
      await get().fetchBootstrap();
    }
    const currentUserId = get().userId;
    const url = currentUserId
      ? `${API_BASE_URL}/api/fleets/missions/${missionId}/recall?userId=${currentUserId}`
      : `${API_BASE_URL}/api/fleets/missions/${missionId}/recall`;

    try {
      const res = await fetch(url, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: data?.message ?? "Filo geri çağırma işlemi sunucu tarafından reddedildi.",
        };
      }

      await get().fetchBootstrap();
      return {
        success: true,
        message: data?.message ?? "Filo başarıyla geri çağrıldı ve üsse dönüş rotasına geçti.",
      };
    } catch {
      return { success: false, message: "Sunucu ile iletişim kurulurken ağ hatası oluştu." };
    }
  },
}));
