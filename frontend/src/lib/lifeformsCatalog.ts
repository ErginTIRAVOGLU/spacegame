export type LifeformId = "humans" | "rocktal" | "mechas" | "kaelesh";

export interface LifeformSpeciesConfig {
  id: LifeformId;
  name: string;
  tagline: string;
  playstyle: string;
  isDefaultUnlocked: boolean;
  ratings: {
    metal: "Düşük" | "Orta" | "İyi" | "Çok iyi";
    crystal: "Düşük" | "Orta" | "İyi" | "Çok iyi";
    deuterium: "Düşük" | "Orta" | "İyi" | "Çok iyi";
    research: "Düşük" | "Orta" | "İyi" | "Çok iyi";
    military: "Düşük" | "Orta" | "İyi" | "Çok iyi";
    expedition: "Düşük" | "Orta" | "İyi" | "Çok iyi";
  };
  coreBonuses: string[];
}

export const LIFEFORMS_CATALOG: Record<LifeformId, LifeformSpeciesConfig> = {
  humans: {
    id: "humans",
    name: "İnsanlar (Humans)",
    tagline: "Dengeli Gelişim & Diplomasi",
    playstyle: "Her alanda dengeli gelişmek isteyenler.",
    isDefaultUnlocked: true,
    ratings: {
      metal: "İyi",
      crystal: "İyi",
      deuterium: "İyi",
      research: "Çok iyi",
      military: "Orta",
      expedition: "İyi",
    },
    coreBonuses: [
      "Araştırma sürelerini azaltma",
      "Genel kaynak üretimine katkı",
      "Bazı savaş gemilerini geliştirme",
      "Diğer üç canlı türünü keşfetme (Galaksiler Arası Elçiler)",
    ],
  },
  rocktal: {
    id: "rocktal",
    name: "Rock'tal",
    tagline: "Madencilik ve Kaynak Ekonomisi",
    playstyle: "Madenlerini geliştirip sürekli kaynak biriktirenler.",
    isDefaultUnlocked: false,
    ratings: {
      metal: "Çok iyi",
      crystal: "Çok iyi",
      deuterium: "Çok iyi",
      research: "Orta",
      military: "Orta",
      expedition: "Düşük",
    },
    coreBonuses: [
      "Metal, Kristal ve Deuterium üretimini artırma",
      "Enerji üretimini geliştirme ve bina maliyetlerini düşürme",
      "Savunma ve kaynak ekonomisine doğrudan katkı",
    ],
  },
  mechas: {
    id: "mechas",
    name: "Mekalar (Mechas)",
    tagline: "Askerî Güç ve Filo Üstünlüğü",
    playstyle: "Savaşan, filo kuran ve diğer oyunculara saldıranlar.",
    isDefaultUnlocked: false,
    ratings: {
      metal: "Orta",
      crystal: "Orta",
      deuterium: "İyi",
      research: "Orta",
      military: "Çok iyi",
      expedition: "Düşük",
    },
    coreBonuses: [
      "Gemi üretim süreçlerini hızlandırma",
      "Filo uçuş Deuterium maliyetlerini azaltma",
      "Savaş gemilerinin saldırı, kalkan ve zırh özelliklerini geliştirme",
      "Savaş teknolojilerine katkı",
    ],
  },
  kaelesh: {
    id: "kaelesh",
    name: "Kaelesh",
    tagline: "Keşif, Uzay-Zaman ve Araştırma",
    playstyle: "Sürekli keşif filosu gönderen ve araştırma yapan oyuncular.",
    isDefaultUnlocked: false,
    ratings: {
      metal: "Düşük",
      crystal: "Düşük",
      deuterium: "Düşük",
      research: "Çok iyi",
      military: "Düşük",
      expedition: "Çok iyi",
    },
    coreBonuses: [
      "Keşif görevlerinden elde edilen kaynak ve gemileri artırma",
      "Keşif sürelerine ve başarılarına katkı (filo kaybı riskini azaltma)",
      "Araştırma sürelerini azaltma",
      "Ay oluşumu ve gezegen alanlarıyla (ekstra slot) ilgili avantajlar",
    ],
  },
};

export type LifeformBuildingKey =
  // Humans (12)
  | "residentialSector"
  | "residential-sector"
  | "biosphereFarm"
  | "biosphere-farm"
  | "researchCentre"
  | "research-centre"
  | "academyOfSciences"
  | "academy-of-sciences"
  | "neuroCalibrationCentre"
  | "neuro-calibration-centre"
  | "highEnergySmelting"
  | "high-energy-smelting"
  | "foodSilo"
  | "food-silo"
  | "fusionPoweredProduction"
  | "fusion-powered-production"
  | "skyscraper"
  | "biotechLab"
  | "biotech-lab"
  | "metropolis"
  | "planetaryShield"
  | "planetary-shield"
  // Rock'tal (12)
  | "meditationEnclave"
  | "meditation-enclave"
  | "crystalFarm"
  | "crystal-farm"
  | "runeTechnologium"
  | "rune-technologium"
  | "runeTechnologicalInstitute"
  | "runeForge"
  | "rune-forge"
  | "runicAuditorium"
  | "oriktorium"
  | "meltChamber"
  | "magmaForge"
  | "magma-forge"
  | "disruptionChamber"
  | "disruption-chamber"
  | "ionicCrystalChamber"
  | "megalith"
  | "megalithStructures"
  | "crystalRefinery"
  | "crystal-refinery"
  | "mineralConverter"
  | "deuteriumSynthesiserRocktal"
  | "deuterium-synthesiser-rocktal"
  | "magmaPowerReactor"
  | "mineralResearchCentre"
  | "mineral-research-centre"
  | "geothermalCentre"
  | "advancedRecyclingPlant"
  | "advanced-recycling-plant"
  | "titaniumBulwark"
  // Mechas (12)
  | "assemblyLine"
  | "assembly-line"
  | "productionLine"
  | "fusionCellFactory"
  | "fusion-cell-factory"
  | "bioConverter"
  | "roboticsResearchCentre"
  | "robotics-research-centre"
  | "coreMatrix"
  | "updateNetwork"
  | "update-network"
  | "algorithmHub"
  | "quantumComputerCentre"
  | "quantum-computer-centre"
  | "quantumChamber"
  | "automatisedAssemblyCentre"
  | "automatised-assembly-centre"
  | "nanoAssemblyLine"
  | "highPerformanceTransformer"
  | "high-performance-transformer"
  | "backupPowerCell"
  | "microchipAssemblyLine"
  | "microchip-assembly-line"
  | "advancedRecycler"
  | "productionAssemblyHall"
  | "production-assembly-hall"
  | "factoryCity"
  | "highPerformanceSynthesiser"
  | "high-performance-synthesiser"
  | "superconductingDistributor"
  | "chipMassProduction"
  | "chip-mass-production"
  | "automatedShipyardNetwork"
  | "nanoRepairBots"
  | "nano-repair-bots"
  | "magneticDefenseDome"
  // Kaelesh (12)
  | "sanctuary"
  | "antimatterCondenser"
  | "antimatter-condenser"
  | "luminescentGarden"
  | "vortexChamber"
  | "vortex-chamber"
  | "cosmicResonator"
  | "hallsOfRealisation"
  | "halls-of-realisation"
  | "highTemple"
  | "forumOfTranscendence"
  | "forum-of-transcendence"
  | "divinationChamber"
  | "antimatterConvector"
  | "antimatter-convector"
  | "interdimensionalMine"
  | "cloningLaboratory"
  | "cloning-laboratory"
  | "psionicEnergyCrystal"
  | "chrysalisAccelerator"
  | "chrysalis-accelerator"
  | "terraformingLab"
  | "bioModifier"
  | "bio-modifier"
  | "floatingCities"
  | "psionicModulator"
  | "psionic-modulator"
  | "vortexReactor"
  | "shipManufacturingHall"
  | "ship-manufacturing-hall"
  | "spatiotemporalCrystal"
  | "supraRefractor"
  | "supra-refractor"
  | "auricProtectionNetwork"
  | string;

export interface LifeformBuildingMeta {
  key: LifeformBuildingKey;
  index: number;
  name: string;
  description: string;
  baseMetal: number;
  baseCrystal: number;
  baseDeut: number;
  baseEnergy: number;
  costFactor: number;
  capacityType?: "population" | "food" | "shield" | "tech" | "production";
}

export interface LifeformTechItemMeta {
  slot: number;
  tier: 1 | 2 | 3;
  key?: string;
  name: string;
  description: string;
  requiredPopulation: number;
  baseMetal: number;
  baseCrystal: number;
  baseDeut: number;
  speciesId?: LifeformId;
}

export interface ActiveLifeformQueue {
  buildingKey: LifeformBuildingKey;
  buildingName: string;
  targetLevel: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface ActiveLifeformTechQueue {
  slot: number;
  techName: string;
  targetLevel: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

export interface PlanetLifeformStateDto {
  planetId: string;
  activeSpecies: string;
  isActive?: boolean;
  speciesLevel: number;
  currentXp: number;
  maxXp: number;
  techBonusPercent: number;
  artifactCount: number;
  maxArtifacts: number;
  t1Population: number;
  t2Population: number;
  t3Population: number;
  maxPopulation: number;
  foodBalance: number;
  maxFoodCapacity: number;
  foodPerSecond: number;
  protectedPopulation: number;
  maxProtectedCapacity: number;
  buildingLevels: Record<string, number>;
  techLevels: Record<number, number>;
  speciesBuildingLevels?: Record<string, Record<string, number>>;
  speciesTechLevels?: Record<string, Record<number, number>>;
  slotSpecies?: Record<number, string>;
  unlockedSpecies?: string[];
  activeQueue: ActiveLifeformQueue | null;
  activeTechQueue?: ActiveLifeformTechQueue | null;
}

export function normalizeSpeciesId(raw?: string): LifeformId {
  if (!raw) return "humans";
  const s = raw.toLowerCase().trim();
  if (s.includes("rock")) return "rocktal";
  if (s.includes("mech") || s.includes("meka")) return "mechas";
  if (s.includes("kaelesh")) return "kaelesh";
  return "humans";
}

// -------------------------------------------------------------
// Official Sidian OGame Wiki 18 Technology Slot Population Thresholds
// -------------------------------------------------------------
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

// =============================================================
// 1. İNSANLAR (HUMANS) — 12 BİNA
// =============================================================
export const HUMAN_BUILDINGS_CATALOG: LifeformBuildingMeta[] = [
  {
    key: "residentialSector",
    index: 1,
    name: "Barınma Tesisi",
    description: "Barınma Tesisi (Residential Sector): Nüfus kapasitesi ve büyüme hızı sağlar. T1 İnsanlarını barındırır.",
    baseMetal: 7,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 0,
    costFactor: 1.2,
    capacityType: "population",
  },
  {
    key: "biosphereFarm",
    index: 2,
    name: "Biyosfer Çiftliği",
    description: "Biyosfer Çiftliği (Biosphere Farm): Besin üretimi ve besin depolama kapasitesi sağlar.",
    baseMetal: 5,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 8,
    costFactor: 1.23,
    capacityType: "food",
  },
  {
    key: "researchCentre",
    index: 3,
    name: "Araştırma Merkezi",
    description: "Araştırma Merkezi (Research Centre): Canlı türü teknoloji ağacını açar ve araştırma süresini kısaltır.",
    baseMetal: 20000,
    baseCrystal: 25000,
    baseDeut: 10000,
    baseEnergy: 10,
    costFactor: 1.3,
    capacityType: "tech",
  },
  {
    key: "academyOfSciences",
    index: 4,
    name: "Bilim Akademisi",
    description: "Bilim Akademisi (Academy of Sciences): T1 nüfusu T2'ye dönüştürür (Teknoloji yuvası 7-12 için).",
    baseMetal: 5000,
    baseCrystal: 3200,
    baseDeut: 1500,
    baseEnergy: 15,
    costFactor: 1.4,
    capacityType: "population",
  },
  {
    key: "neuroCalibrationCentre",
    index: 5,
    name: "Nöro Kalibrasyon Merkezi",
    description: "Nöro Kalibrasyon Merkezi (Neuro-Calibration Centre): T2 nüfusu T3'e dönüştürür (Teknoloji yuvası 13-18 için).",
    baseMetal: 50000,
    baseCrystal: 40000,
    baseDeut: 50000,
    baseEnergy: 30,
    costFactor: 1.5,
    capacityType: "population",
  },
  {
    key: "highEnergySmelting",
    index: 6,
    name: "Yüksek Enerji Potası",
    description: "Yüksek Enerji Potası (High Energy Smelting): Gezegendeki Metal üretimini artırır.",
    baseMetal: 9000,
    baseCrystal: 6000,
    baseDeut: 3000,
    baseEnergy: 40,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "foodSilo",
    index: 7,
    name: "Besin Deposu",
    description: "Besin Deposu (Food Silo): Besin depolama kapasitesini artırır ve besin tüketimini düşürür.",
    baseMetal: 25000,
    baseCrystal: 13000,
    baseDeut: 7000,
    baseEnergy: 0,
    costFactor: 1.09,
    capacityType: "food",
  },
  {
    key: "fusionPoweredProduction",
    index: 8,
    name: "Füzyonla Yapılan Madencilik",
    description: "Füzyonla Yapılan Madencilik (Fusion-Powered Production): Gezegendeki Kristal ve Deuterium üretimini artırır.",
    baseMetal: 50000,
    baseCrystal: 25000,
    baseDeut: 15000,
    baseEnergy: 80,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "skyscraper",
    index: 9,
    name: "Gökdelen",
    description: "Gökdelen (Skyscraper): Nüfus kapasitesini ve artış hızını yükseltir.",
    baseMetal: 75000,
    baseCrystal: 20000,
    baseDeut: 25000,
    baseEnergy: 50,
    costFactor: 1.09,
    capacityType: "population",
  },
  {
    key: "biotechLab",
    index: 10,
    name: "Biyotek Laboratuvarı",
    description: "Biyotek Laboratuvarı (Biotech Lab): Besin üretimini büyük oranda artırır.",
    baseMetal: 150000,
    baseCrystal: 30000,
    baseDeut: 15000,
    baseEnergy: 60,
    costFactor: 1.12,
    capacityType: "production",
  },
  {
    key: "metropolis",
    index: 11,
    name: "Metropol",
    description: "Metropol (Metropolis): Gezegendeki tüm canlı türü teknoloji bonuslarını güçlendirir.",
    baseMetal: 80000,
    baseCrystal: 35000,
    baseDeut: 60000,
    baseEnergy: 90,
    costFactor: 1.3,
    capacityType: "production",
  },
  {
    key: "planetaryShield",
    index: 12,
    name: "Gezegen Kalkanı",
    description: "Gezegen Kalkanı (Planetary Shield): Saldırılarda nüfus kaybını azaltır ve korur.",
    baseMetal: 250000,
    baseCrystal: 125000,
    baseDeut: 125000,
    baseEnergy: 100,
    costFactor: 1.2,
    capacityType: "shield",
  },
];

// =============================================================
// 2. ROCK'TAL — 12 BİNA
// =============================================================
export const ROCKTAL_BUILDINGS_CATALOG: LifeformBuildingMeta[] = [
  {
    key: "meditationEnclave",
    index: 1,
    name: "Meditasyon Bölgesi",
    description: "Meditasyon Bölgesi (Meditation Enclave): Rock'tal nüfus kapasitesi ve artış hızı sağlar.",
    baseMetal: 9,
    baseCrystal: 3,
    baseDeut: 0,
    baseEnergy: 0,
    costFactor: 1.2,
    capacityType: "population",
  },
  {
    key: "crystalFarm",
    index: 2,
    name: "Kristal Çiftliği",
    description: "Kristal Çiftliği (Crystal Farm): Rock'tal için besin (kristal enerji) üretir.",
    baseMetal: 7,
    baseCrystal: 3,
    baseDeut: 0,
    baseEnergy: 10,
    costFactor: 1.23,
    capacityType: "food",
  },
  {
    key: "runeTechnologium",
    index: 3,
    name: "Rün Teknolojisi Merkezi",
    description: "Rün Teknolojisi Merkezi (Rune Technologium): Rock'tal teknoloji ağacını açar ve araştırma maliyetlerini düşürür.",
    baseMetal: 25000,
    baseCrystal: 30000,
    baseDeut: 12000,
    baseEnergy: 12,
    costFactor: 1.3,
    capacityType: "tech",
  },
  {
    key: "runeForge",
    index: 4,
    name: "Rün Ocağı",
    description: "Rün Ocağı (Rune Forge): T1 nüfusu T2'ye dönüştürür.",
    baseMetal: 6000,
    baseCrystal: 4000,
    baseDeut: 2000,
    baseEnergy: 18,
    costFactor: 1.4,
    capacityType: "population",
  },
  {
    key: "oriktorium",
    index: 5,
    name: "Oriktoryum",
    description: "Oriktoryum (Oriktorium): T2 nüfusu T3'e dönüştürür.",
    baseMetal: 60000,
    baseCrystal: 50000,
    baseDeut: 60000,
    baseEnergy: 35,
    costFactor: 1.5,
    capacityType: "population",
  },
  {
    key: "magmaForge",
    index: 6,
    name: "Magma Ocağı",
    description: "Magma Ocağı (Magma Forge): Gezegendeki Metal üretimini yüksek oranda artırır.",
    baseMetal: 11000,
    baseCrystal: 7000,
    baseDeut: 4000,
    baseEnergy: 45,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "disruptionChamber",
    index: 7,
    name: "Kesinti Odası",
    description: "Kesinti Odası (Disruption Chamber): Gezegendeki enerji üretimini artırır ve bina enerji tüketimini düşürür.",
    baseMetal: 30000,
    baseCrystal: 16000,
    baseDeut: 8000,
    baseEnergy: 0,
    costFactor: 1.09,
    capacityType: "food",
  },
  {
    key: "megalith",
    index: 8,
    name: "Megalit",
    description: "Megalit (Megalith): Rock'tal bina inşaat maliyetlerini ve sürelerini düşürür.",
    baseMetal: 90000,
    baseCrystal: 25000,
    baseDeut: 30000,
    baseEnergy: 55,
    costFactor: 1.09,
    capacityType: "population",
  },
  {
    key: "crystalRefinery",
    index: 9,
    name: "Kristal Rafinerisi",
    description: "Kristal Rafinerisi (Crystal Refinery): Gezegendeki Kristal üretimini yüksek oranda artırır.",
    baseMetal: 60000,
    baseCrystal: 30000,
    baseDeut: 18000,
    baseEnergy: 90,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "deuteriumSynthesiserRocktal",
    index: 10,
    name: "Deuterium Sentezleyicisi (Rock'tal)",
    description: "Deuterium Sentezleyicisi (Deuterium Synthesiser): Gezegendeki Deuterium üretimini artırır.",
    baseMetal: 180000,
    baseCrystal: 40000,
    baseDeut: 20000,
    baseEnergy: -100,
    costFactor: 1.12,
    capacityType: "production",
  },
  {
    key: "mineralResearchCentre",
    index: 11,
    name: "Mineral Araştırma Merkezi",
    description: "Mineral Araştırma Merkezi (Mineral Research Centre): Maden binalarının (Metal, Kristal, Deut) inşaat maliyetlerini düşürür.",
    baseMetal: 95000,
    baseCrystal: 45000,
    baseDeut: 70000,
    baseEnergy: 100,
    costFactor: 1.3,
    capacityType: "production",
  },
  {
    key: "advancedRecyclingPlant",
    index: 12,
    name: "Gelişmiş Geri Dönüşüm Tesisi",
    description: "Gelişmiş Geri Dönüşüm Tesisi (Advanced Recycling Plant): Gezegen savunmasından oluşan harabe/geri kazanımı artırır.",
    baseMetal: 300000,
    baseCrystal: 150000,
    baseDeut: 150000,
    baseEnergy: 110,
    costFactor: 1.2,
    capacityType: "shield",
  },
];

// =============================================================
// 3. MEKALAR (MECHA) — 12 BİNA
// =============================================================
export const MECHAS_BUILDINGS_CATALOG: LifeformBuildingMeta[] = [
  {
    key: "assemblyLine",
    index: 1,
    name: "Montaj Hattı",
    description: "Montaj Hattı (Assembly Line): Mecha nüfus kapasitesi ve hızlı üretim sağlar.",
    baseMetal: 8,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 0,
    costFactor: 1.2,
    capacityType: "population",
  },
  {
    key: "fusionCellFactory",
    index: 2,
    name: "Füzyon Hücresi Fabrikası",
    description: "Füzyon Hücresi Fabrikası (Fusion Cell Factory): Mecha için besin (enerji hücresi) üretir.",
    baseMetal: 6,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 9,
    costFactor: 1.23,
    capacityType: "food",
  },
  {
    key: "roboticsResearchCentre",
    index: 3,
    name: "Robotik Araştırma Merkezi",
    description: "Robotik Araştırma Merkezi (Robotics Research Centre): Mecha teknoloji ağacını açar.",
    baseMetal: 22000,
    baseCrystal: 26000,
    baseDeut: 11000,
    baseEnergy: 12,
    costFactor: 1.3,
    capacityType: "tech",
  },
  {
    key: "updateNetwork",
    index: 4,
    name: "Güncelleme Ağı",
    description: "Güncelleme Ağı (Update Network): T1 nüfusu T2'ye dönüştürür.",
    baseMetal: 5500,
    baseCrystal: 3500,
    baseDeut: 1800,
    baseEnergy: 16,
    costFactor: 1.4,
    capacityType: "population",
  },
  {
    key: "quantumComputerCentre",
    index: 5,
    name: "Kuantum Bilgisayar Merkezi",
    description: "Kuantum Bilgisayar Merkezi (Quantum Computer Centre): T2 nüfusu T3'e dönüştürür.",
    baseMetal: 55000,
    baseCrystal: 45000,
    baseDeut: 55000,
    baseEnergy: 32,
    costFactor: 1.5,
    capacityType: "population",
  },
  {
    key: "automatisedAssemblyCentre",
    index: 6,
    name: "Otomatik Montaj Merkezi",
    description: "Otomatik Montaj Merkezi (Automatised Assembly Centre): Gezegendeki Tersane (gemi ve savunma) üretim sürelerini kısaltır.",
    baseMetal: 10000,
    baseCrystal: 6500,
    baseDeut: 3500,
    baseEnergy: 42,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "highPerformanceTransformer",
    index: 7,
    name: "Yüksek Performanslı Transformatör",
    description: "Yüksek Performanslı Transformatör (High-Performance Transformer): Enerji üretimini ve gezegendeki teknoloji bonuslarını artırır.",
    baseMetal: 27000,
    baseCrystal: 14000,
    baseDeut: 7500,
    baseEnergy: 0,
    costFactor: 1.09,
    capacityType: "food",
  },
  {
    key: "microchipAssemblyLine",
    index: 8,
    name: "Mikroçip Montaj Hattı",
    description: "Mikroçip Montaj Hattı (Microchip Assembly Line): Nüfus artış hızını ve besin verimliliğini yükseltir.",
    baseMetal: 52000,
    baseCrystal: 26000,
    baseDeut: 16000,
    baseEnergy: 85,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "productionAssemblyHall",
    index: 9,
    name: "Üretim Montaj Salonu",
    description: "Üretim Montaj Salonu (Production Assembly Hall): Nüfus kapasitesini büyük oranda artırır.",
    baseMetal: 80000,
    baseCrystal: 22000,
    baseDeut: 27000,
    baseEnergy: 52,
    costFactor: 1.09,
    capacityType: "population",
  },
  {
    key: "highPerformanceSynthesiser",
    index: 10,
    name: "Yüksek Performanslı Sentezleyici",
    description: "Yüksek Performanslı Sentezleyici (High-Performance Synthesiser): Gezegendeki Deuterium üretimini artırır.",
    baseMetal: 160000,
    baseCrystal: 32000,
    baseDeut: 16000,
    baseEnergy: 65,
    costFactor: 1.12,
    capacityType: "production",
  },
  {
    key: "chipMassProduction",
    index: 11,
    name: "Çip Seri Üretimi",
    description: "Çip Seri Üretimi (Chip Mass Production): Gezegendeki canlı türü teknoloji bonuslarını güçlendirir.",
    baseMetal: 85000,
    baseCrystal: 38000,
    baseDeut: 65000,
    baseEnergy: 95,
    costFactor: 1.3,
    capacityType: "production",
  },
  {
    key: "nanoRepairBots",
    index: 12,
    name: "Nano Onarım Robotları",
    description: "Nano Onarım Robotları (Nano Repair Bots): Savaş sonrası Uzay İskelesi (Wreckfield / Enkaz) onarım oranını artırır.",
    baseMetal: 260000,
    baseCrystal: 130000,
    baseDeut: 130000,
    baseEnergy: 105,
    costFactor: 1.2,
    capacityType: "shield",
  },
];

// =============================================================
// 4. KAELESH — 12 BİNA
// =============================================================
export const KAELESH_BUILDINGS_CATALOG: LifeformBuildingMeta[] = [
  {
    key: "sanctuary",
    index: 1,
    name: "Tapınak / Sığınak",
    description: "Tapınak / Sığınak (Sanctuary): Kaelesh nüfus kapasitesi ve artış hızı sağlar.",
    baseMetal: 7,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 0,
    costFactor: 1.2,
    capacityType: "population",
  },
  {
    key: "antimatterCondenser",
    index: 2,
    name: "Antimadde Kondansatörü",
    description: "Antimadde Kondansatörü (Antimatter Condenser): Kaelesh için besin üretir.",
    baseMetal: 5,
    baseCrystal: 2,
    baseDeut: 0,
    baseEnergy: 8,
    costFactor: 1.23,
    capacityType: "food",
  },
  {
    key: "vortexChamber",
    index: 3,
    name: "Girdap Odası",
    description: "Girdap Odası (Vortex Chamber): Kaelesh teknoloji ağacını açar.",
    baseMetal: 20000,
    baseCrystal: 24000,
    baseDeut: 10000,
    baseEnergy: 10,
    costFactor: 1.3,
    capacityType: "tech",
  },
  {
    key: "hallsOfRealisation",
    index: 4,
    name: "İdrak Salonları",
    description: "İdrak Salonları (Halls of Realisation): T1 nüfusu T2'ye dönüştürür.",
    baseMetal: 5000,
    baseCrystal: 3000,
    baseDeut: 1500,
    baseEnergy: 15,
    costFactor: 1.4,
    capacityType: "population",
  },
  {
    key: "forumOfTranscendence",
    index: 5,
    name: "Aşkınlık Forumu",
    description: "Aşkınlık Forumu (Forum of Transcendence): T2 nüfusu T3'e dönüştürür.",
    baseMetal: 50000,
    baseCrystal: 38000,
    baseDeut: 48000,
    baseEnergy: 30,
    costFactor: 1.5,
    capacityType: "population",
  },
  {
    key: "antimatterConvector",
    index: 6,
    name: "Antimadde Konvektörü",
    description: "Antimadde Konvektörü (Antimatter Convector): Besin tüketimini düşürür ve dönüşüm verimliliğini artırır.",
    baseMetal: 9500,
    baseCrystal: 6200,
    baseDeut: 3200,
    baseEnergy: 38,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "cloningLaboratory",
    index: 7,
    name: "Klonlama Laboratuvarı",
    description: "Klonlama Laboratuvarı (Cloning Laboratory): Nüfus artış hızını yükseltir.",
    baseMetal: 24000,
    baseCrystal: 12500,
    baseDeut: 6800,
    baseEnergy: 0,
    costFactor: 1.09,
    capacityType: "food",
  },
  {
    key: "chrysalisAccelerator",
    index: 8,
    name: "Krizalit Hızlandırıcı",
    description: "Krizalit Hızlandırıcı (Chrysalis Accelerator): Nüfus kapasitesini büyük oranda artırır.",
    baseMetal: 48000,
    baseCrystal: 24000,
    baseDeut: 14000,
    baseEnergy: 75,
    costFactor: 1.5,
    capacityType: "production",
  },
  {
    key: "bioModifier",
    index: 9,
    name: "Biyo Modifikatör",
    description: "Biyo Modifikatör (Bio Modifier): Gezegene ekstra Gezegen Alanı (Planet Fields) kazandırır.",
    baseMetal: 72000,
    baseCrystal: 19000,
    baseDeut: 24000,
    baseEnergy: 48,
    costFactor: 1.09,
    capacityType: "population",
  },
  {
    key: "psionicModulator",
    index: 10,
    name: "Psiyonik Modülatör",
    description: "Psiyonik Modülatör (Psionic Modulator): Gezegendeki Kaelesh teknoloji bonuslarını artırır.",
    baseMetal: 145000,
    baseCrystal: 29000,
    baseDeut: 14000,
    baseEnergy: 58,
    costFactor: 1.12,
    capacityType: "production",
  },
  {
    key: "shipManufacturingHall",
    index: 11,
    name: "Gemi Üretim Salonu",
    description: "Gemi Üretim Salonu (Ship Manufacturing Hall): Tersane üretim sürelerini kısaltır.",
    baseMetal: 78000,
    baseCrystal: 34000,
    baseDeut: 58000,
    baseEnergy: 88,
    costFactor: 1.3,
    capacityType: "production",
  },
  {
    key: "supraRefractor",
    index: 12,
    name: "Supra Refraktör",
    description: "Supra Refraktör (Supra Refractor): Ay oluşum şansını ve maksimum Ay boyutunu artırır.",
    baseMetal: 240000,
    baseCrystal: 120000,
    baseDeut: 120000,
    baseEnergy: 95,
    costFactor: 1.2,
    capacityType: "shield",
  },
];

export const SPECIES_BUILDINGS_CATALOG: Record<LifeformId, LifeformBuildingMeta[]> = {
  humans: HUMAN_BUILDINGS_CATALOG,
  rocktal: ROCKTAL_BUILDINGS_CATALOG,
  mechas: MECHAS_BUILDINGS_CATALOG,
  kaelesh: KAELESH_BUILDINGS_CATALOG,
};

// =============================================================
// 1. İNSANLAR TEKNOLOJİLERİ (18 YUVA)
// =============================================================
export const HUMAN_TECH_CATALOG: LifeformTechItemMeta[] = [
  // Tier 1 (Slot 1..6)
  {
    slot: 1,
    tier: 1,
    key: "intergalacticEnvoys",
    name: "Galaksiler Arası Elçiler",
    description: "Galaksiler Arası Elçiler (Intergalactic Envoys): Galakside diğer canlı türlerini keşfetmeyi sağlar ve keşif süresini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[1],
    baseMetal: 5000,
    baseCrystal: 2500,
    baseDeut: 500,
    speciesId: "humans",
  },
  {
    slot: 2,
    tier: 1,
    key: "highPerformanceExtractors",
    name: "Yüksek Performanslı Ekstraktörler",
    description: "Yüksek Performanslı Ekstraktörler (High-Performance Extractors): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[2],
    baseMetal: 7000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "humans",
  },
  {
    slot: 3,
    tier: 1,
    key: "fusionDrives",
    name: "Füzyon İticileri",
    description: "Füzyon İticileri (Fusion Drives): Sivil gemilerin hızını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[3],
    baseMetal: 15000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "humans",
  },
  {
    slot: 4,
    tier: 1,
    key: "stealthFieldGenerator",
    name: "Gizlilik Alanı Jeneratörü",
    description: "Gizlilik Alanı Jeneratörü (Stealth Field Generator): Casusluk araştırması ve karşı casusluk avantajı sağlar.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[4],
    baseMetal: 20000,
    baseCrystal: 15000,
    baseDeut: 7500,
    speciesId: "humans",
  },
  {
    slot: 5,
    tier: 1,
    key: "orbitalDen",
    name: "Yörünge İni",
    description: "Yörünge İni (Orbital Den): Kaynak sığınağı kapasitesini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[5],
    baseMetal: 25000,
    baseCrystal: 20000,
    baseDeut: 10000,
    speciesId: "humans",
  },
  {
    slot: 6,
    tier: 1,
    key: "researchAi",
    name: "Araştırma Yapay Zekası",
    description: "Araştırma Yapay Zekası (Research AI): Standart araştırmaların süresini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[6],
    baseMetal: 35000,
    baseCrystal: 25000,
    baseDeut: 15000,
    speciesId: "humans",
  },
  // Tier 2 (Slot 7..12)
  {
    slot: 7,
    tier: 2,
    key: "highPerformanceTerraformer",
    name: "Yüksek Performanslı Terraformer",
    description: "Yüksek Performanslı Terraformer (High-Performance Terraformer): Terraformer maliyetini düşürür ve süresini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[7],
    baseMetal: 50000,
    baseCrystal: 40000,
    baseDeut: 20000,
    speciesId: "humans",
  },
  {
    slot: 8,
    tier: 2,
    key: "enhancedProductionTechnologies",
    name: "Gelişmiş Üretim Teknolojileri",
    description: "Gelişmiş Üretim Teknolojileri (Enhanced Production Technologies): Maden üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[8],
    baseMetal: 80000,
    baseCrystal: 50000,
    baseDeut: 20000,
    speciesId: "humans",
  },
  {
    slot: 9,
    tier: 2,
    key: "lightFighterMkIi",
    name: "Hafif Avcı Mk II",
    description: "Hafif Avcı Mk II (Light Fighter Mk II): Hafif Avcı saldırı, kalkan, zırh ve hızını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[9],
    baseMetal: 120000,
    baseCrystal: 90000,
    baseDeut: 30000,
    speciesId: "humans",
  },
  {
    slot: 10,
    tier: 2,
    key: "cruiserMkIi",
    name: "Kruvazör Mk II",
    description: "Kruvazör Mk II (Cruiser Mk II): Kruvazör istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[10],
    baseMetal: 160000,
    baseCrystal: 120000,
    baseDeut: 50000,
    speciesId: "humans",
  },
  {
    slot: 11,
    tier: 2,
    key: "improvedLabTechnology",
    name: "Gelişmiş Laboratuvar Teknolojisi",
    description: "Gelişmiş Laboratuvar Teknolojisi (Improved Lab Technology): Araştırma sürelerini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[11],
    baseMetal: 220000,
    baseCrystal: 180000,
    baseDeut: 80000,
    speciesId: "humans",
  },
  {
    slot: 12,
    tier: 2,
    key: "plasmaTerraformer",
    name: "Plazma Terraformer",
    description: "Plazma Terraformer (Plasma Terraformer): Terraformer bina maliyetlerini ve süresini azaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[12],
    baseMetal: 300000,
    baseCrystal: 240000,
    baseDeut: 100000,
    speciesId: "humans",
  },
  // Tier 3 (Slot 13..18)
  {
    slot: 13,
    tier: 3,
    key: "lowTemperatureDrives",
    name: "Düşük Sıcaklık İticileri",
    description: "Düşük Sıcaklık İticileri (Low-Temperature Drives): Casus sondası ve sivil filo hızlarını iyileştirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[13],
    baseMetal: 500000,
    baseCrystal: 350000,
    baseDeut: 150000,
    speciesId: "humans",
  },
  {
    slot: 14,
    tier: 3,
    key: "bomberMkIi",
    name: "Bombardıman Gemisi Mk II",
    description: "Bombardıman Gemisi Mk II (Bomber Mk II): Bombardıman Gemisi istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[14],
    baseMetal: 650000,
    baseCrystal: 500000,
    baseDeut: 250000,
    speciesId: "humans",
  },
  {
    slot: 15,
    tier: 3,
    key: "destroyerMkIi",
    name: "Muhrip Mk II",
    description: "Muhrip Mk II (Destroyer Mk II): Muhrip istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[15],
    baseMetal: 850000,
    baseCrystal: 650000,
    baseDeut: 30000,
    speciesId: "humans",
  },
  {
    slot: 16,
    tier: 3,
    key: "battlecruiserMkIi",
    name: "Fırkateyn Mk II",
    description: "Fırkateyn Mk II (Battlecruiser Mk II): Fırkateyn istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[16],
    baseMetal: 1100000,
    baseCrystal: 850000,
    baseDeut: 400000,
    speciesId: "humans",
  },
  {
    slot: 17,
    tier: 3,
    key: "robotAssistants",
    name: "Robot Asistanlar",
    description: "Robot Asistanlar (Robot Assistants): Araştırma sürelerini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[17],
    baseMetal: 1500000,
    baseCrystal: 1200000,
    baseDeut: 600000,
    speciesId: "humans",
  },
  {
    slot: 18,
    tier: 3,
    key: "supercomputer",
    name: "Süper Bilgisayar",
    description: "Süper Bilgisayar (Supercomputer): Tüm standart araştırmaların maliyetini ve süresini düşürür.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[18],
    baseMetal: 2000000,
    baseCrystal: 1600000,
    baseDeut: 800000,
    speciesId: "humans",
  },
];

// =============================================================
// 2. ROCK'TAL TEKNOLOJİLERİ (18 YUVA)
// =============================================================
export const ROCKTAL_TECH_CATALOG: LifeformTechItemMeta[] = [
  // Tier 1 (Slot 1..6)
  {
    slot: 1,
    tier: 1,
    key: "volcanicBatteries",
    name: "Volkanik Piller",
    description: "Volkanik Piller (Volcanic Batteries): Enerji üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[1],
    baseMetal: 5000,
    baseCrystal: 2500,
    baseDeut: 500,
    speciesId: "rocktal",
  },
  {
    slot: 2,
    tier: 1,
    key: "acousticScanning",
    name: "Akustik Tarama",
    description: "Akustik Tarama (Acoustic Scanning): Tüm madenlerin üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[2],
    baseMetal: 7000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "rocktal",
  },
  {
    slot: 3,
    tier: 1,
    key: "highEnergyPumpSystems",
    name: "Yüksek Enerjili Pompa Sistemleri",
    description: "Yüksek Enerjili Pompa Sistemleri (High Energy Pump Systems): Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[3],
    baseMetal: 15000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "rocktal",
  },
  {
    slot: 4,
    tier: 1,
    key: "cargoHoldExpansionCivilianShips",
    name: "Kargo Kapasitesi Genişletme (Sivil Gemiler)",
    description: "Kargo Kapasitesi Genişletme (Cargo Hold Expansion): Sivil gemilerin yük kapasitesini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[4],
    baseMetal: 20000,
    baseCrystal: 15000,
    baseDeut: 7500,
    speciesId: "rocktal",
  },
  {
    slot: 5,
    tier: 1,
    key: "magmaPoweredProduction",
    name: "Magma Güçlü Üretim",
    description: "Magma Güçlü Üretim (Magma-Powered Production): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[5],
    baseMetal: 25000,
    baseCrystal: 20000,
    baseDeut: 10000,
    speciesId: "rocktal",
  },
  {
    slot: 6,
    tier: 1,
    key: "geothermalPowerPlants",
    name: "Jeotermal Enerji Santralleri",
    description: "Jeotermal Enerji Santralleri (Geothermal Power Plants): Enerji üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[6],
    baseMetal: 35000,
    baseCrystal: 25000,
    baseDeut: 15000,
    speciesId: "rocktal",
  },
  // Tier 2 (Slot 7..12)
  {
    slot: 7,
    tier: 2,
    key: "depthSounding",
    name: "Derinlik Sondajı",
    description: "Derinlik Sondajı (Depth Sounding): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[7],
    baseMetal: 50000,
    baseCrystal: 40000,
    baseDeut: 20000,
    speciesId: "rocktal",
  },
  {
    slot: 8,
    tier: 2,
    key: "ionCrystalEnhancementHeavyFighter",
    name: "İyon Kristal Güçlendirmesi (Ağır Avcı)",
    description: "İyon Kristal Güçlendirmesi (Ion Crystal Enhancement): Ağır Avcı istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[8],
    baseMetal: 80000,
    baseCrystal: 50000,
    baseDeut: 20000,
    speciesId: "rocktal",
  },
  {
    slot: 9,
    tier: 2,
    key: "improvedStellarator",
    name: "Geliştirilmiş Stellarator",
    description: "Geliştirilmiş Stellarator (Improved Stellarator): Füzyon reaktörü maliyetini düşürür ve enerjisini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[9],
    baseMetal: 120000,
    baseCrystal: 90000,
    baseDeut: 30000,
    speciesId: "rocktal",
  },
  {
    slot: 10,
    tier: 2,
    key: "hardenedDiamondDrillHeads",
    name: "Sertleştirilmiş Elmas Matkap Uçları",
    description: "Sertleştirilmiş Elmas Matkap Uçları (Hardened Diamond Drill Heads): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[10],
    baseMetal: 160000,
    baseCrystal: 120000,
    baseDeut: 50000,
    speciesId: "rocktal",
  },
  {
    slot: 11,
    tier: 2,
    key: "seismicMiningTechnology",
    name: "Sismik Madencilik Teknolojisi",
    description: "Sismik Madencilik Teknolojisi (Seismic Mining Technology): Tüm madenlerin üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[11],
    baseMetal: 220000,
    baseCrystal: 180000,
    baseDeut: 80000,
    speciesId: "rocktal",
  },
  {
    slot: 12,
    tier: 2,
    key: "magmaPoweredPumpSystems",
    name: "Magma Güçlü Pompa Sistemleri",
    description: "Magma Güçlü Pompa Sistemleri (Magma-Powered Pump Systems): Maden üretimini ve enerji verimliliğini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[12],
    baseMetal: 300000,
    baseCrystal: 240000,
    baseDeut: 100000,
    speciesId: "rocktal",
  },
  // Tier 3 (Slot 13..18)
  {
    slot: 13,
    tier: 3,
    key: "ionCrystalModules",
    name: "İyon Kristal Modülleri",
    description: "İyon Kristal Modülleri (Ion Crystal Modules): Paletli (Crawler) verimliliğini ve enerji bonusunu artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[13],
    baseMetal: 500000,
    baseCrystal: 350000,
    baseDeut: 150000,
    speciesId: "rocktal",
  },
  {
    slot: 14,
    tier: 3,
    key: "optimisedSiloConstructionMethod",
    name: "Optimize Silo İnşa Yöntemi",
    description: "Optimize Silo İnşa Yöntemi (Optimised Silo Construction Method): Depo ve tesis maliyetlerini düşürür.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[14],
    baseMetal: 650000,
    baseCrystal: 500000,
    baseDeut: 250000,
    speciesId: "rocktal",
  },
  {
    slot: 15,
    tier: 3,
    key: "diamondEnergyTransmitter",
    name: "Elmas Enerji İleticisi",
    description: "Elmas Enerji İleticisi (Diamond Energy Transmitter): Enerji üretimini yükseltir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[15],
    baseMetal: 850000,
    baseCrystal: 650000,
    baseDeut: 30000,
    speciesId: "rocktal",
  },
  {
    slot: 16,
    tier: 3,
    key: "obsidianShieldReinforcement",
    name: "Obsidyen Kalkan Güçlendirmesi",
    description: "Obsidyen Kalkan Güçlendirmesi (Obsidian Shield Reinforcement): Gezegen savunma birimlerinin istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[16],
    baseMetal: 1100000,
    baseCrystal: 850000,
    baseDeut: 400000,
    speciesId: "rocktal",
  },
  {
    slot: 17,
    tier: 3,
    key: "runeShields",
    name: "Rün Kalkanları",
    description: "Rün Kalkanları (Rune Shields): Küçük ve Büyük Kalkan Kubbelerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[17],
    baseMetal: 1500000,
    baseCrystal: 1200000,
    baseDeut: 600000,
    speciesId: "rocktal",
  },
  {
    slot: 18,
    tier: 3,
    key: "rocktalCollectorEnhancement",
    name: "Rock'tal Koleksiyoncu Güçlendirmesi",
    description: "Rock'tal Koleksiyoncu Güçlendirmesi (Rock'tal Collector Enhancement): Koleksiyoncu (Collector) oyuncu sınıfı bonuslarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[18],
    baseMetal: 2000000,
    baseCrystal: 1600000,
    baseDeut: 800000,
    speciesId: "rocktal",
  },
];

// =============================================================
// 3. MEKALAR TEKNOLOJİLERİ (18 YUVA)
// =============================================================
export const MECHAS_TECH_CATALOG: LifeformTechItemMeta[] = [
  // Tier 1 (Slot 1..6)
  {
    slot: 1,
    tier: 1,
    key: "catalyserTechnology",
    name: "Katalizör Teknolojisi",
    description: "Katalizör Teknolojisi (Catalyser Technology): Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[1],
    baseMetal: 5000,
    baseCrystal: 2500,
    baseDeut: 500,
    speciesId: "mechas",
  },
  {
    slot: 2,
    tier: 1,
    key: "plasmaDrive",
    name: "Plazma İticisi",
    description: "Plazma İticisi (Plasma Drive): Keşif gemisi dışındaki savaş gemilerinin hızını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[2],
    baseMetal: 7000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "mechas",
  },
  {
    slot: 3,
    tier: 1,
    key: "efficiencyModule",
    name: "Verimlilik Modülü",
    description: "Verimlilik Modülü (Efficiency Module): Tüm gemilerin Deuterium (yakıt) tüketimini azaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[3],
    baseMetal: 15000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "mechas",
  },
  {
    slot: 4,
    tier: 1,
    key: "depotAi",
    name: "Depo Yapay Zekası",
    description: "Depo Yapay Zekası (Depot AI): İttifak deposu ve yakıt verimliliğini geliştirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[4],
    baseMetal: 20000,
    baseCrystal: 15000,
    baseDeut: 7500,
    speciesId: "mechas",
  },
  {
    slot: 5,
    tier: 1,
    key: "generalOverhaulLightFighter",
    name: "Genel Revizyon (Hafif Avcı)",
    description: "Genel Revizyon (Hafif Avcı) (General Overhaul: Light Fighter): Hafif Avcı istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[5],
    baseMetal: 25000,
    baseCrystal: 20000,
    baseDeut: 10000,
    speciesId: "mechas",
  },
  {
    slot: 6,
    tier: 1,
    key: "automatedTransportLines",
    name: "Otomatik Taşıma Hatları",
    description: "Otomatik Taşıma Hatları (Automated Transport Lines): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[6],
    baseMetal: 35000,
    baseCrystal: 25000,
    baseDeut: 15000,
    speciesId: "mechas",
  },
  // Tier 2 (Slot 7..12)
  {
    slot: 7,
    tier: 2,
    key: "improvedDroneAi",
    name: "Gelişmiş Dron Yapay Zekası",
    description: "Gelişmiş Dron Yapay Zekası (Improved Drone AI): Casusluk ve filo hızını iyileştirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[7],
    baseMetal: 50000,
    baseCrystal: 40000,
    baseDeut: 20000,
    speciesId: "mechas",
  },
  {
    slot: 8,
    tier: 2,
    key: "experimentalRecyclingTechnology",
    name: "Deneysel Geri Dönüşüm Teknolojisi",
    description: "Deneysel Geri Dönüşüm Teknolojisi (Experimental Recycling Technology): Geri Dönüşümcü (Recycler) hız ve kapasitesini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[8],
    baseMetal: 80000,
    baseCrystal: 50000,
    baseDeut: 20000,
    speciesId: "mechas",
  },
  {
    slot: 9,
    tier: 2,
    key: "generalOverhaulCruiser",
    name: "Genel Revizyon (Kruvazör)",
    description: "Genel Revizyon (Kruvazör) (General Overhaul: Cruiser): Kruvazör istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[9],
    baseMetal: 120000,
    baseCrystal: 90000,
    baseDeut: 30000,
    speciesId: "mechas",
  },
  {
    slot: 10,
    tier: 2,
    key: "slingshotAutopilot",
    name: "Sapan Otomatik Pilotu",
    description: "Sapan Otomatik Pilotu (Slingshot Autopilot): Geri çağrılan filolarda harcanan yakıtın bir kısmını iade eder ve dönüş hızını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[10],
    baseMetal: 160000,
    baseCrystal: 120000,
    baseDeut: 50000,
    speciesId: "mechas",
  },
  {
    slot: 11,
    tier: 2,
    key: "highTemperatureSuperconductors",
    name: "Yüksek Sıcaklık Süper İletkenleri",
    description: "Yüksek Sıcaklık Süper İletkenleri (High-Temperature Superconductors): Enerji üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[11],
    baseMetal: 220000,
    baseCrystal: 180000,
    baseDeut: 80000,
    speciesId: "mechas",
  },
  {
    slot: 12,
    tier: 2,
    key: "generalOverhaulBattleship",
    name: "Genel Revizyon (Komuta Gemisi)",
    description: "Genel Revizyon (Komuta Gemisi) (General Overhaul: Battleship): Komuta Gemisi istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[12],
    baseMetal: 300000,
    baseCrystal: 240000,
    baseDeut: 100000,
    speciesId: "mechas",
  },
  // Tier 3 (Slot 13..18)
  {
    slot: 13,
    tier: 3,
    key: "artificialSwarmIntelligence",
    name: "Yapay Sürü Zekası",
    description: "Yapay Sürü Zekası (Artificial Swarm Intelligence): Tüm madenlerin üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[13],
    baseMetal: 500000,
    baseCrystal: 350000,
    baseDeut: 150000,
    speciesId: "mechas",
  },
  {
    slot: 14,
    tier: 3,
    key: "generalOverhaulBattlecruiser",
    name: "Genel Revizyon (Fırkateyn)",
    description: "Genel Revizyon (Fırkateyn) (General Overhaul: Battlecruiser): Fırkateyn istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[14],
    baseMetal: 650000,
    baseCrystal: 500000,
    baseDeut: 250000,
    speciesId: "mechas",
  },
  {
    slot: 15,
    tier: 3,
    key: "generalOverhaulBomber",
    name: "Genel Revizyon (Bombardıman Gemisi)",
    description: "Genel Revizyon (Bombardıman Gemisi) (General Overhaul: Bomber): Bombardıman Gemisi istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[15],
    baseMetal: 850000,
    baseCrystal: 650000,
    baseDeut: 30000,
    speciesId: "mechas",
  },
  {
    slot: 16,
    tier: 3,
    key: "generalOverhaulDestroyer",
    name: "Genel Revizyon (Muhrip)",
    description: "Genel Revizyon (Muhrip) (General Overhaul: Destroyer): Muhrip istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[16],
    baseMetal: 1100000,
    baseCrystal: 850000,
    baseDeut: 400000,
    speciesId: "mechas",
  },
  {
    slot: 17,
    tier: 3,
    key: "experimentalWeaponsTechnology",
    name: "Deneysel Silah Teknolojisi",
    description: "Deneysel Silah Teknolojisi (Experimental Weapons Technology): Silah, Kalkan ve Zırh araştırmalarının maliyet ve süresini azaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[17],
    baseMetal: 1500000,
    baseCrystal: 1200000,
    baseDeut: 600000,
    speciesId: "mechas",
  },
  {
    slot: 18,
    tier: 3,
    key: "mechanGeneralEnhancement",
    name: "Meka General Güçlendirmesi",
    description: "Meka General Güçlendirmesi (Mechan General Enhancement): General oyuncu sınıfı bonuslarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[18],
    baseMetal: 2000000,
    baseCrystal: 1600000,
    baseDeut: 800000,
    speciesId: "mechas",
  },
];

// =============================================================
// 4. KAELESH TEKNOLOJİLERİ (18 YUVA)
// =============================================================
export const KAELESH_TECH_CATALOG: LifeformTechItemMeta[] = [
  // Tier 1 (Slot 1..6)
  {
    slot: 1,
    tier: 1,
    key: "heatRecovery",
    name: "Isı Geri Kazanımı",
    description: "Isı Geri Kazanımı (Heat Recovery): Gemilerin Deuterium yakıt tüketimini azaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[1],
    baseMetal: 5000,
    baseCrystal: 2500,
    baseDeut: 500,
    speciesId: "kaelesh",
  },
  {
    slot: 2,
    tier: 1,
    key: "sulphideProcess",
    name: "Sülfit İşlemi",
    description: "Sülfit İşlemi (Sulphide Process): Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[2],
    baseMetal: 7000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "kaelesh",
  },
  {
    slot: 3,
    tier: 1,
    key: "psionicNetwork",
    name: "Psiyonik Ağ",
    description: "Psiyonik Ağ (Psionic Network): Keşiflerde canlı türü kaybı / kara delik riskini azaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[3],
    baseMetal: 15000,
    baseCrystal: 10000,
    baseDeut: 5000,
    speciesId: "kaelesh",
  },
  {
    slot: 4,
    tier: 1,
    key: "telekineticTractorBeam",
    name: "Telekinetik Çekici Işın",
    description: "Telekinetik Çekici Işın (Telekinetic Tractor Beam): Keşif (Sefer) uçuşlarından bulunan gemi miktarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[4],
    baseMetal: 20000,
    baseCrystal: 15000,
    baseDeut: 7500,
    speciesId: "kaelesh",
  },
  {
    slot: 5,
    tier: 1,
    key: "enhancedSensorTechnology",
    name: "Gelişmiş Sensör Teknolojisi",
    description: "Gelişmiş Sensör Teknolojisi (Enhanced Sensor Technology): Keşif uçuşlarından bulunan kaynak (Metal, Kristal, Deut) miktarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[5],
    baseMetal: 25000,
    baseCrystal: 20000,
    baseDeut: 10000,
    speciesId: "kaelesh",
  },
  {
    slot: 6,
    tier: 1,
    key: "neuromodalCompressor",
    name: "Nöromodal Kompresör",
    description: "Nöromodal Kompresör (Neuromodal Compressor): Sivil ve askeri gemilerin kargo kapasitesini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[6],
    baseMetal: 35000,
    baseCrystal: 25000,
    baseDeut: 15000,
    speciesId: "kaelesh",
  },
  // Tier 2 (Slot 7..12)
  {
    slot: 7,
    tier: 2,
    key: "neuroInterface",
    name: "Nöro Arayüz",
    description: "Nöro Arayüz (Neuro-Interface): Araştırma sürelerini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[7],
    baseMetal: 50000,
    baseCrystal: 40000,
    baseDeut: 20000,
    speciesId: "kaelesh",
  },
  {
    slot: 8,
    tier: 2,
    key: "interplanetaryAnalysisNetwork",
    name: "Gezegenlerarası Analiz Ağı",
    description: "Gezegenlerarası Analiz Ağı (Interplanetary Analysis Network): Ay üzerindeki Sensör Falanks (Sensor Phalanx) menzilini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[8],
    baseMetal: 80000,
    baseCrystal: 50000,
    baseDeut: 20000,
    speciesId: "kaelesh",
  },
  {
    slot: 9,
    tier: 2,
    key: "overclockingHeavyFighter",
    name: "Hız Aşırtma (Ağır Avcı)",
    description: "Hız Aşırtma (Ağır Avcı) (Overclocking: Heavy Fighter): Ağır Avcı istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[9],
    baseMetal: 120000,
    baseCrystal: 90000,
    baseDeut: 30000,
    speciesId: "kaelesh",
  },
  {
    slot: 10,
    tier: 2,
    key: "telekineticDrive",
    name: "Telekinetik İtici",
    description: "Telekinetik İtici (Telekinetic Drive): Keşif (Expedition) uçuşlarında filo hızını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[10],
    baseMetal: 160000,
    baseCrystal: 120000,
    baseDeut: 50000,
    speciesId: "kaelesh",
  },
  {
    slot: 11,
    tier: 2,
    key: "sixthSense",
    name: "Altıncı His",
    description: "Altıncı His (Sixth Sense): Keşif uçuşlarından bulunan kaynak miktarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[11],
    baseMetal: 220000,
    baseCrystal: 180000,
    baseDeut: 80000,
    speciesId: "kaelesh",
  },
  {
    slot: 12,
    tier: 2,
    key: "psychoharmoniser",
    name: "Psikoharmonizör",
    description: "Psikoharmonizör (Psychoharmoniser): Metal, Kristal ve Deuterium üretimini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[12],
    baseMetal: 300000,
    baseCrystal: 240000,
    baseDeut: 100000,
    speciesId: "kaelesh",
  },
  // Tier 3 (Slot 13..18)
  {
    slot: 13,
    tier: 3,
    key: "efficientSwarmIntelligence",
    name: "Verimli Sürü Zekası",
    description: "Verimli Sürü Zekası (Efficient Swarm Intelligence): Araştırma sürelerini kısaltır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[13],
    baseMetal: 500000,
    baseCrystal: 350000,
    baseDeut: 150000,
    speciesId: "kaelesh",
  },
  {
    slot: 14,
    tier: 3,
    key: "overclockingLargeCargo",
    name: "Hız Aşırtma (Büyük Nakliye)",
    description: "Hız Aşırtma (Büyük Nakliye) (Overclocking: Large Cargo): Büyük Nakliye Gemisi hız ve kapasitesini artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[14],
    baseMetal: 650000,
    baseCrystal: 500000,
    baseDeut: 250000,
    speciesId: "kaelesh",
  },
  {
    slot: 15,
    tier: 3,
    key: "gravitationSensors",
    name: "Kütleçekim Sensörleri",
    description: "Kütleçekim Sensörleri (Gravitation Sensors): Keşif uçuşlarından bulunan Karanlık Madde miktarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[15],
    baseMetal: 850000,
    baseCrystal: 650000,
    baseDeut: 30000,
    speciesId: "kaelesh",
  },
  {
    slot: 16,
    tier: 3,
    key: "overclockingBattleship",
    name: "Hız Aşırtma (Komuta Gemisi)",
    description: "Hız Aşırtma (Komuta Gemisi) (Overclocking: Battleship): Komuta Gemisi istatistiklerini güçlendirir.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[16],
    baseMetal: 1100000,
    baseCrystal: 850000,
    baseDeut: 400000,
    speciesId: "kaelesh",
  },
  {
    slot: 17,
    tier: 3,
    key: "psionicShieldMatrix",
    name: "Psiyonik Kalkan Matrisi",
    description: "Psiyonik Kalkan Matrisi (Psionic Shield Matrix): Graviton ve kalkan araştırmalarının maliyet/süresini düşürür.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[17],
    baseMetal: 1500000,
    baseCrystal: 1200000,
    baseDeut: 600000,
    speciesId: "kaelesh",
  },
  {
    slot: 18,
    tier: 3,
    key: "kaeleshDiscovererEnhancement",
    name: "Kaelesh Kaşif Güçlendirmesi",
    description: "Kaelesh Kaşif Güçlendirmesi (Kaelesh Discoverer Enhancement): Kaşif (Discoverer) oyuncu sınıfı bonuslarını artırır.",
    requiredPopulation: TECH_SLOT_POPULATION_THRESHOLDS[18],
    baseMetal: 2000000,
    baseCrystal: 1600000,
    baseDeut: 800000,
    speciesId: "kaelesh",
  },
];

export const SPECIES_TECH_CATALOG: Record<LifeformId, LifeformTechItemMeta[]> = {
  humans: HUMAN_TECH_CATALOG,
  rocktal: ROCKTAL_TECH_CATALOG,
  mechas: MECHAS_TECH_CATALOG,
  kaelesh: KAELESH_TECH_CATALOG,
};

// Aliases for backward compatibility
export const LIFEFORM_BUILDINGS_CATALOG = HUMAN_BUILDINGS_CATALOG;
export const LIFEFORM_TECH_CATALOG = HUMAN_TECH_CATALOG;

export function getBuildingsForSpecies(speciesId?: string): LifeformBuildingMeta[] {
  const norm = normalizeSpeciesId(speciesId);
  return SPECIES_BUILDINGS_CATALOG[norm] || HUMAN_BUILDINGS_CATALOG;
}

export function getTechsForSpecies(speciesId?: string): LifeformTechItemMeta[] {
  const norm = normalizeSpeciesId(speciesId);
  return SPECIES_TECH_CATALOG[norm] || HUMAN_TECH_CATALOG;
}

export function getTechForSlot(slot: number, speciesId?: string): LifeformTechItemMeta {
  const list = getTechsForSpecies(speciesId);
  return list.find((t) => t.slot === slot) || list[0];
}

export function getAllTechsForSlot(slot: number): { species: LifeformSpeciesConfig; tech: LifeformTechItemMeta }[] {
  const speciesList: LifeformId[] = ["humans", "rocktal", "mechas", "kaelesh"];
  return speciesList.map((spId) => ({
    species: LIFEFORMS_CATALOG[spId],
    tech: SPECIES_TECH_CATALOG[spId].find((t) => t.slot === slot) || SPECIES_TECH_CATALOG[spId][0],
  }));
}

export function calculateLifeformBuildingUpgrade(
  meta: LifeformBuildingMeta,
  currentLevel: number
) {
  const targetLevel = currentLevel + 1;
  const multiplier = Math.pow(meta.costFactor, targetLevel - 1) * targetLevel;
  const metal = Math.max(1, Math.floor(meta.baseMetal * multiplier));
  const crystal = Math.max(1, Math.floor(meta.baseCrystal * multiplier));
  const deuterium = Math.floor(meta.baseDeut * multiplier);
  const energyDelta =
    meta.baseEnergy > 0
      ? Math.max(1, Math.ceil(meta.baseEnergy * targetLevel * Math.pow(1.05, targetLevel)))
      : 0;
  const durationSeconds = Math.max(
    6,
    Math.min(7200, Math.floor(12 * Math.pow(1.22, targetLevel)))
  );

  return {
    targetLevel,
    metal,
    crystal,
    deuterium,
    energyDelta,
    durationSeconds,
  };
}

export function calculateLifeformTechUpgrade(
  meta: LifeformTechItemMeta,
  currentLevel: number,
  researchCentreLevel: number = 1
) {
  const targetLevel = currentLevel + 1;
  const discount = Math.max(0.5, 1.0 - researchCentreLevel * 0.02);
  const costFactor = 1.3;
  const multiplier =
    Math.pow(costFactor, targetLevel - 1) * targetLevel * discount;

  const metal = Math.max(1, Math.floor(meta.baseMetal * multiplier));
  const crystal = Math.max(1, Math.floor(meta.baseCrystal * multiplier));
  const deuterium = Math.max(0, Math.floor(meta.baseDeut * multiplier));
  const durationSeconds = Math.max(
    10,
    Math.floor(30 * Math.pow(1.25, targetLevel) * discount)
  );

  return {
    targetLevel,
    metal,
    crystal,
    deuterium,
    durationSeconds,
  };
}
