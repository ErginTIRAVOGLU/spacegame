import {
  PlanetResourceSettings,
  PlanetSummary,
  calculateSolarSatelliteUnitEnergy,
  calculateFusionReactorEnergy,
  calculateFusionReactorDeuteriumConsumption,
  calculateStorageCapacity,
} from "@/store/useGameStore";
import {
  ResourceProductionRow,
  ResourceSettingsMatrix,
} from "@/types/resourceSettings";
import {
  getSlotMetadata,
  getSlotProductionMultipliers,
} from "./planetGenerationService";

export interface BuildMatrixParams {
  planet?: PlanetSummary;
  settings: PlanetResourceSettings;
  researches?: Record<number, number>;
  playerClass?: "None" | "Collector" | "General" | "Discoverer";
  officersStatus?: {
    commander?: boolean;
    admiral?: boolean;
    engineer?: boolean;
    geologist?: boolean;
    technocrat?: boolean;
  };
  activeBoosters?: Array<{
    resourceType: string;
    multiplier: number;
    expiresAtUtc?: string;
  }>;
  lifeformBonuses?: {
    metalBuildingBonus?: number;
    crystalBuildingBonus?: number;
    deutBuildingBonus?: number;
    metalTechBonus?: number;
    crystalTechBonus?: number;
    deutTechBonus?: number;
  };
}

export function buildResourceSettingsMatrix(
  params: BuildMatrixParams
): ResourceSettingsMatrix {
  const {
    planet,
    settings,
    researches = {},
    playerClass = "None",
    officersStatus = {},
    activeBoosters = [],
    lifeformBonuses = {},
  } = params;

  const getLevel = (key: string) =>
    planet?.buildings?.find((b) => b.key === key)?.level ?? 0;

  const metalLvl = getLevel("metalMine");
  const crystalLvl = getLevel("crystalMine");
  const deutLvl = getLevel("deuteriumSynthesizer");
  const solarLvl = getLevel("solarPlant");
  const fusionLvl = getLevel("fusionReactor");

  // In domain models, SolarSatellite (212) and Crawler (217) are in units or buildings
  const UNIT_TYPE_MAP: Record<string, number> = {
    solarSatellite: 212,
    crawler: 217,
  };

  const getUnitCount = (key: string) => {
    const targetType = UNIT_TYPE_MAP[key];
    const fromUnits = targetType
      ? planet?.units?.find((u) => u.unitType === targetType)?.count
      : undefined;
    if (typeof fromUnits === "number") return fromUnits;
    const fromBuildings = planet?.buildings?.find((b) => b.key === key)?.level;
    return typeof fromBuildings === "number" ? fromBuildings : 0;
  };

  const satCount = getUnitCount("solarSatellite");
  const crawlerCount = getUnitCount("crawler");

  // Officer & Class statuses
  const isCollector = playerClass === "Collector";
  const hasEngineer = Boolean(officersStatus.engineer);
  const hasGeologist = Boolean(officersStatus.geologist);
  const hasCommander = Boolean(officersStatus.commander);
  const hasAdmiral = Boolean(officersStatus.admiral);
  const hasTechnocrat = Boolean(officersStatus.technocrat);
  const hasCommandStaff =
    hasCommander && hasAdmiral && hasEngineer && hasGeologist && hasTechnocrat;

  // Max crawlers: floor((M + C + D) * 8 * (1 + GeologistBonus))
  // GeologistBonus = 0.10 only applies for Collector class with active Geologist officer
  const geologistActiveCrawlerBonus = isCollector && hasGeologist;
  const geologistCrawlerMultiplier = geologistActiveCrawlerBonus ? 1.10 : 1.0;
  const maxCrawlers = Math.floor(
    (metalLvl + crystalLvl + deutLvl) * 8 * geologistCrawlerMultiplier
  );

  const metalStorageLvl = getLevel("metalStorage");
  const crystalStorageLvl = getLevel("crystalStorage");
  const deutTankLvl = getLevel("deuteriumTank");

  const tempAvg = planet ? (planet.tempMin + planet.tempMax) / 2.0 : 20.0;
  const tempMax = planet ? planet.tempMax : 40.0;
  const slot = planet?.slot ?? 8;
  const slotMeta = getSlotMetadata(slot);
  const { metal: slotMetalMult, crystal: slotCrystalMult } =
    getSlotProductionMultipliers(slot);

  // Base income (Standard 5x universe: 280 Metal, 120 Crystal, 0 Deut)
  const baseMetal = 280;
  const baseCrystal = 120;
  const baseDeut = 0;

  // Raw base mine outputs (at 100% capacity)
  const rawMetalOut = Math.round(30 * metalLvl * Math.pow(1.1, metalLvl));
  const rawMetalEnergy = Math.ceil(10 * metalLvl * Math.pow(1.1, metalLvl));

  const rawCrystalOut = Math.round(20 * crystalLvl * Math.pow(1.1, crystalLvl));
  const rawCrystalEnergy = Math.ceil(10 * crystalLvl * Math.pow(1.1, crystalLvl));

  // Deuterium synthesis based on max temp: floor(10 * L * 1.1^L * (1.44 - 0.004 * tempMax))
  const rawDeutOut = Math.max(
    0,
    Math.round(10 * deutLvl * Math.pow(1.1, deutLvl) * (1.44 - 0.004 * tempMax))
  );
  const rawDeutEnergy = Math.ceil(20 * deutLvl * Math.pow(1.1, deutLvl));

  // Research levels
  const energyTechLevel = researches[113] ?? 0;
  const plasmaTechLevel = researches[122] ?? 0;

  // Energy production facilities
  const rawSolarEnergy = Math.floor(20 * solarLvl * Math.pow(1.1, solarLvl));
  const rawFusionEnergy = calculateFusionReactorEnergy(
    fusionLvl,
    energyTechLevel,
    100
  );
  const rawFusionDeutConsumed = calculateFusionReactorDeuteriumConsumption(
    fusionLvl,
    100
  );

  const satUnitEnergy = calculateSolarSatelliteUnitEnergy(tempMax);
  const rawSatEnergy = Math.max(0, satCount * satUnitEnergy);

  // Settings percentages (0.0 to 1.0)
  const mRatio = (settings.metalMinePercent ?? 100) / 100.0;
  const cRatio = (settings.crystalMinePercent ?? 100) / 100.0;
  const dRatio = (settings.deuteriumSynthesizerPercent ?? 100) / 100.0;
  const sRatio = (settings.solarPlantPercent ?? 100) / 100.0;
  const fRatio = (settings.fusionReactorPercent ?? 100) / 100.0;
  const satRatio = (settings.solarSatellitePercent ?? 100) / 100.0;
  const crawlerPercent = settings.crawlerPercent ?? 100;
  const crRatio = crawlerPercent / 100.0;

  // Energy consumption
  const metalEnergyConsumed = Math.ceil(rawMetalEnergy * mRatio);
  const crystalEnergyConsumed = Math.ceil(rawCrystalEnergy * cRatio);
  const deutEnergyConsumed = Math.ceil(rawDeutEnergy * dRatio);

  // Crawler Energy: 50 at <=100%, +10 per +10% over 100% up to 100 at 150% (2x)
  const crawlerEnergyPerUnit =
    crawlerPercent <= 100
      ? 50
      : 50 + Math.min(5, Math.floor((crawlerPercent - 100) / 10)) * 10;
  const crawlerEnergyConsumed = Math.ceil(
    crawlerCount * crawlerEnergyPerUnit * Math.min(1.0, crRatio)
  );

  const totalConsumedEnergy =
    metalEnergyConsumed +
    crystalEnergyConsumed +
    deutEnergyConsumed +
    crawlerEnergyConsumed;

  // Gross energy produced before bonuses
  const solarEnergyProduced = Math.floor(rawSolarEnergy * sRatio);
  const fusionEnergyProduced = Math.floor(rawFusionEnergy * fRatio);
  const satEnergyProduced = Math.floor(rawSatEnergy * satRatio);
  const grossEnergyProduced =
    solarEnergyProduced + fusionEnergyProduced + satEnergyProduced;

  // Energy production multipliers
  const collectorEnergyMultiplier = isCollector ? 0.10 : 0.0;
  const engineerEnergyMultiplier = hasEngineer ? 0.10 : 0.0;
  const staffEnergyMultiplier = hasCommandStaff ? 0.02 : 0.0;

  const collectorEnergyBonus = Math.round(
    grossEnergyProduced * collectorEnergyMultiplier
  );
  const engineerEnergyBonus = Math.round(
    grossEnergyProduced * engineerEnergyMultiplier
  );
  const staffEnergyBonus = Math.round(
    grossEnergyProduced * staffEnergyMultiplier
  );

  const totalProducedEnergy =
    grossEnergyProduced +
    collectorEnergyBonus +
    engineerEnergyBonus +
    staffEnergyBonus;

  // Efficiency ratio (Bottleneck)
  const efficiency =
    totalConsumedEnergy <= 0
      ? 1.0
      : totalProducedEnergy >= totalConsumedEnergy
      ? 1.0
      : totalProducedEnergy / totalConsumedEnergy;

  const productionFactorPercent = Math.min(
    100,
    Math.round(efficiency * 100)
  );
  const productionFactor = productionFactorPercent / 100.0;

  // Scaled Base Mine Outputs (incorporating setting percentage & energy efficiency)
  const metalMineOut = Math.round(rawMetalOut * mRatio * efficiency);
  const crystalMineOut = Math.round(rawCrystalOut * cRatio * efficiency);
  const deutMineOut = Math.round(rawDeutOut * dRatio * efficiency);
  const fusionDeutCost = Math.ceil(rawFusionDeutConsumed * fRatio);

  // Crawler Bonus (Task 15)
  // Base 0.02% (0.0002) per crawler; Collector at 100% gets +50% (0.0003); Collector at 150% overload gets 0.02% * 1.5 * 1.5 = 0.045% (0.00045)
  // Max total crawler bonus is capped at 50% (0.50)
  const effectiveCrawlerCount = Math.min(
    crawlerCount,
    maxCrawlers > 0 ? maxCrawlers : crawlerCount
  );
  const crawlerBoostPerUnit = !isCollector
    ? 0.0002 * Math.min(1.0, crRatio)
    : 0.0002 * crRatio * 1.5;

  const rawCrawlerFactor = Math.min(
    0.50,
    effectiveCrawlerCount * crawlerBoostPerUnit * efficiency
  );
  const crawlerMetal = Math.round(metalMineOut * rawCrawlerFactor);
  const crawlerCrystal = Math.round(crystalMineOut * rawCrawlerFactor);
  const crawlerDeut = Math.round(deutMineOut * rawCrawlerFactor);

  // Slot bonuses (Task 15)
  const slotBonusMetal =
    slotMetalMult > 1.0 ? Math.round(metalMineOut * (slotMetalMult - 1.0)) : 0;
  const slotBonusCrystal =
    slotCrystalMult > 1.0
      ? Math.round(crystalMineOut * (slotCrystalMult - 1.0))
      : 0;

  // Officer Bonuses (+10% mine production for Geologist, +2% for Command Staff)
  const geologistMetal = hasGeologist ? Math.round(metalMineOut * 0.10) : 0;
  const geologistCrystal = hasGeologist ? Math.round(crystalMineOut * 0.10) : 0;
  const geologistDeut = hasGeologist ? Math.round(deutMineOut * 0.10) : 0;

  const staffMetal = hasCommandStaff ? Math.round(metalMineOut * 0.02) : 0;
  const staffCrystal = hasCommandStaff ? Math.round(crystalMineOut * 0.02) : 0;
  const staffDeut = hasCommandStaff ? Math.round(deutMineOut * 0.02) : 0;

  // Collector Class Mine Bonus (+25%)
  const collectorMetal = isCollector ? Math.round(metalMineOut * 0.25) : 0;
  const collectorCrystal = isCollector ? Math.round(crystalMineOut * 0.25) : 0;
  const collectorDeut = isCollector ? Math.round(deutMineOut * 0.25) : 0;

  // Plasma Technology Bonus (+1% Metal, +0.66% Crystal, +0.33% Deut per level)
  const plasmaMetal = Math.round(metalMineOut * (plasmaTechLevel * 0.01));
  const plasmaCrystal = Math.round(crystalMineOut * (plasmaTechLevel * 0.0066));
  const plasmaDeut = Math.round(deutMineOut * (plasmaTechLevel * 0.0033));

  // Item Boosters
  const metalBoosterMultiplier =
    activeBoosters.find((b) => b.resourceType.toLowerCase() === "metal")
      ?.multiplier ?? 0;
  const crystalBoosterMultiplier =
    activeBoosters.find((b) => b.resourceType.toLowerCase() === "crystal")
      ?.multiplier ?? 0;
  const deutBoosterMultiplier =
    activeBoosters.find((b) => b.resourceType.toLowerCase() === "deuterium")
      ?.multiplier ?? 0;

  const metalBoosterOut = Math.round(metalMineOut * metalBoosterMultiplier);
  const crystalBoosterOut = Math.round(crystalMineOut * crystalBoosterMultiplier);
  const deutBoosterOut = Math.round(deutMineOut * deutBoosterMultiplier);

  // Lifeform Bonuses
  const lifeformBldMetal = Math.round(
    metalMineOut * (lifeformBonuses.metalBuildingBonus ?? 0)
  );
  const lifeformBldCrystal = Math.round(
    crystalMineOut * (lifeformBonuses.crystalBuildingBonus ?? 0)
  );
  const lifeformBldDeut = Math.round(
    deutMineOut * (lifeformBonuses.deutBuildingBonus ?? 0)
  );

  const lifeformTechMetal = Math.round(
    metalMineOut * (lifeformBonuses.metalTechBonus ?? 0)
  );
  const lifeformTechCrystal = Math.round(
    crystalMineOut * (lifeformBonuses.crystalTechBonus ?? 0)
  );
  const lifeformTechDeut = Math.round(
    deutMineOut * (lifeformBonuses.deutTechBonus ?? 0)
  );

  // Storage Capacities
  const metalCap = calculateStorageCapacity(metalStorageLvl);
  const crystalCap = calculateStorageCapacity(crystalStorageLvl);
  const deutCap = calculateStorageCapacity(deutTankLvl);

  // Hourly totals
  const hourlyMetal =
    baseMetal +
    metalMineOut +
    slotBonusMetal +
    crawlerMetal +
    geologistMetal +
    staffMetal +
    collectorMetal +
    plasmaMetal +
    metalBoosterOut +
    lifeformBldMetal +
    lifeformTechMetal;

  const hourlyCrystal =
    baseCrystal +
    crystalMineOut +
    slotBonusCrystal +
    crawlerCrystal +
    geologistCrystal +
    staffCrystal +
    collectorCrystal +
    plasmaCrystal +
    crystalBoosterOut +
    lifeformBldCrystal +
    lifeformTechCrystal;

  const hourlyDeut =
    baseDeut +
    deutMineOut +
    crawlerDeut +
    geologistDeut +
    staffDeut +
    collectorDeut +
    plasmaDeut +
    deutBoosterOut +
    lifeformBldDeut +
    lifeformTechDeut -
    fusionDeutCost;

  const netEnergy = totalProducedEnergy - totalConsumedEnergy;

  // The 28 canonical OGame rows
  const rows: ResourceProductionRow[] = [
    // 1. Ana Gelir
    {
      key: "base_income",
      label: "Ana Gelir",
      metal: baseMetal,
      crystal: baseCrystal,
      deuterium: baseDeut,
      energy: 0,
      hasSetting: false,
      category: "base",
    },
    // 2. Metal Madeni
    {
      key: "metalMine",
      label: "Metal Madeni",
      levelOrCount: metalLvl,
      metal: metalMineOut,
      crystal: 0,
      deuterium: 0,
      energy: -metalEnergyConsumed,
      percentage: settings.metalMinePercent ?? 100,
      hasSetting: true,
      category: "building",
    },
    // 3. Kristal Madeni
    {
      key: "crystalMine",
      label: "Kristal Madeni",
      levelOrCount: crystalLvl,
      metal: 0,
      crystal: crystalMineOut,
      deuterium: 0,
      energy: -crystalEnergyConsumed,
      percentage: settings.crystalMinePercent ?? 100,
      hasSetting: true,
      category: "building",
    },
    // 4. Deuterium Sentezleyicisi
    {
      key: "deuteriumSynthesizer",
      label: "Deuterium Sentezleyicisi",
      levelOrCount: deutLvl,
      metal: 0,
      crystal: 0,
      deuterium: deutMineOut,
      energy: -deutEnergyConsumed,
      percentage: settings.deuteriumSynthesizerPercent ?? 100,
      hasSetting: true,
      category: "building",
    },
    // 5. Solar Enerji Santrali
    {
      key: "solarPlant",
      label: "Solar Enerji Santrali",
      levelOrCount: solarLvl,
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: solarEnergyProduced,
      percentage: settings.solarPlantPercent ?? 100,
      hasSetting: true,
      category: "building",
    },
    // 6. Füzyoenerji Santrali
    {
      key: "fusionReactor",
      label: "Füzyoenerji Santrali",
      levelOrCount: fusionLvl,
      metal: 0,
      crystal: 0,
      deuterium: -fusionDeutCost,
      energy: fusionEnergyProduced,
      percentage: settings.fusionReactorPercent ?? 100,
      hasSetting: true,
      category: "building",
    },
    // 7. Solar Uydu
    {
      key: "solarSatellite",
      label: "Solar Uydu",
      levelOrCount: satCount,
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: satEnergyProduced,
      percentage: settings.solarSatellitePercent ?? 100,
      hasSetting: true,
      category: "unit",
    },
    // 8. Paletli / Crawler
    {
      key: "crawler",
      label: "Paletli",
      levelOrCount: crawlerCount,
      maxCount: maxCrawlers,
      metal: crawlerMetal,
      crystal: crawlerCrystal,
      deuterium: crawlerDeut,
      energy: -crawlerEnergyConsumed,
      percentage: settings.crawlerPercent ?? 100,
      hasSetting: true,
      category: "unit",
    },
    // 9. Mühendis (Officer)
    {
      key: "officer_engineer",
      label: "Mühendis",
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: engineerEnergyBonus,
      officerActive: hasEngineer,
      hasSetting: false,
      category: "officer",
    },
    // 10. Jeolog (Officer)
    {
      key: "officer_geologist",
      label: "Jeolog",
      metal: geologistMetal,
      crystal: geologistCrystal,
      deuterium: geologistDeut,
      energy: 0,
      officerActive: hasGeologist,
      hasSetting: false,
      category: "officer",
    },
    // 11. Komutanlık Kadrosu (Staff Bonus)
    {
      key: "officer_command_staff",
      label: "Komutanlık Kadrosu",
      metal: staffMetal,
      crystal: staffCrystal,
      deuterium: staffDeut,
      energy: staffEnergyBonus,
      officerActive: hasCommandStaff,
      hasSetting: false,
      category: "officer",
    },
    // 12. Toplayıcı Sınıfı (Collector Class)
    {
      key: "class_collector",
      label: "Toplayıcı Sınıfı",
      levelOrCount: isCollector ? 1 : 0,
      metal: collectorMetal,
      crystal: collectorCrystal,
      deuterium: collectorDeut,
      energy: collectorEnergyBonus,
      hasSetting: false,
      category: "class",
    },
    // 13. Yörünge Pozisyonu Bonusu (Task 15)
    {
      key: "slot_bonus",
      label: `Yörünge Bonusu (Slot ${slot}: ${slotMeta.bonusDescription})`,
      levelOrCount: slot,
      metal: slotBonusMetal,
      crystal: slotBonusCrystal,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "class",
    },
    // 14. Plazma Tekniği
    {
      key: "tech_plasma",
      label: "Plazma Tekniği",
      levelOrCount: plasmaTechLevel,
      metal: plasmaMetal,
      crystal: plasmaCrystal,
      deuterium: plasmaDeut,
      energy: 0,
      hasSetting: false,
      category: "tech",
    },
    // 14. Enerji Tekniği
    {
      key: "tech_energy",
      label: "Enerji Tekniği",
      levelOrCount: energyTechLevel,
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "tech",
    },
    // 15. İttifak Bonusu
    {
      key: "alliance_bonus",
      label: "İttifak Bonusu",
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "alliance",
    },
    // 16. Metal Güçlendirici
    {
      key: "booster_metal",
      label: "Metal Güçlendirici",
      metal: metalBoosterOut,
      crystal: 0,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "booster",
    },
    // 17. Kristal Güçlendirici
    {
      key: "booster_crystal",
      label: "Kristal Güçlendirici",
      metal: 0,
      crystal: crystalBoosterOut,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "booster",
    },
    // 18. Deuterium Güçlendirici
    {
      key: "booster_deuterium",
      label: "Deuterium Güçlendirici",
      metal: 0,
      crystal: 0,
      deuterium: deutBoosterOut,
      energy: 0,
      hasSetting: false,
      category: "booster",
    },
    // 19. Canlı Türü Binaları
    {
      key: "lifeform_buildings",
      label: "Canlı Türü Binaları",
      metal: lifeformBldMetal,
      crystal: lifeformBldCrystal,
      deuterium: lifeformBldDeut,
      energy: 0,
      hasSetting: false,
      category: "lifeform",
    },
    // 20. Canlı Türü Teknolojileri
    {
      key: "lifeform_tech",
      label: "Canlı Türü Teknolojileri",
      metal: lifeformTechMetal,
      crystal: lifeformTechCrystal,
      deuterium: lifeformTechDeut,
      energy: 0,
      hasSetting: false,
      category: "lifeform",
    },
    // 21. Depo Kapasitesi: Metal Deposu
    {
      key: "storage_metal",
      label: "Depo Kapasitesi: Metal Deposu",
      levelOrCount: metalStorageLvl,
      metal: metalCap,
      crystal: 0,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "storage",
    },
    // 22. Depo Kapasitesi: Kristal Deposu
    {
      key: "storage_crystal",
      label: "Depo Kapasitesi: Kristal Deposu",
      levelOrCount: crystalStorageLvl,
      metal: 0,
      crystal: crystalCap,
      deuterium: 0,
      energy: 0,
      hasSetting: false,
      category: "storage",
    },
    // 23. Depo Kapasitesi: Deuterium Tankeri
    {
      key: "storage_deuterium",
      label: "Depo Kapasitesi: Deuterium Tankeri",
      levelOrCount: deutTankLvl,
      metal: 0,
      crystal: 0,
      deuterium: deutCap,
      energy: 0,
      hasSetting: false,
      category: "storage",
    },
    // 24. Korumalı Sığınak Kapasitesi
    {
      key: "storage_bunker",
      label: "Korumalı Sığınak Kapasitesi",
      metal: Math.round(metalCap * 0.10),
      crystal: Math.round(crystalCap * 0.10),
      deuterium: Math.round(deutCap * 0.10),
      energy: 0,
      hasSetting: false,
      category: "storage",
    },
    // 25. Toplam Saatlik Üretim
    {
      key: "total_hourly",
      label: "Toplam Saatlik Üretim",
      metal: hourlyMetal,
      crystal: hourlyCrystal,
      deuterium: hourlyDeut,
      energy: netEnergy,
      hasSetting: false,
      category: "total",
    },
    // 26. Toplam Günlük Üretim
    {
      key: "total_daily",
      label: "Toplam Günlük Üretim",
      metal: hourlyMetal * 24,
      crystal: hourlyCrystal * 24,
      deuterium: hourlyDeut * 24,
      energy: 0,
      hasSetting: false,
      category: "total",
    },
    // 27. Toplam Haftalık Üretim
    {
      key: "total_weekly",
      label: "Toplam Haftalık Üretim",
      metal: hourlyMetal * 168,
      crystal: hourlyCrystal * 168,
      deuterium: hourlyDeut * 168,
      energy: 0,
      hasSetting: false,
      category: "total",
    },
    // 28. Net Enerji & Üretim Faktörü Bilançosu
    {
      key: "production_factor_summary",
      label: "Net Enerji & Üretim Faktörü Bilançosu",
      metal: 0,
      crystal: 0,
      deuterium: 0,
      energy: netEnergy,
      percentage: productionFactorPercent,
      hasSetting: false,
      category: "total",
    },
  ];

  return {
    planetName: planet?.name ?? "Ana Gezegen",
    productionFactor,
    rows,
    storageCapacities: {
      metal: metalCap,
      crystal: crystalCap,
      deuterium: deutCap,
    },
    totals: {
      hourly: {
        metal: hourlyMetal,
        crystal: hourlyCrystal,
        deuterium: hourlyDeut,
        energy: `${netEnergy >= 0 ? "+" : ""}${netEnergy.toLocaleString("tr-TR")}`,
      },
      daily: {
        metal: hourlyMetal * 24,
        crystal: hourlyCrystal * 24,
        deuterium: hourlyDeut * 24,
        energy: "—",
      },
      weekly: {
        metal: hourlyMetal * 168,
        crystal: hourlyCrystal * 168,
        deuterium: hourlyDeut * 168,
        energy: "—",
      },
    },
  };
}
